const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const CUSTOMER_ID = '64b000000000000000000001';
const OTHER_CUSTOMER_ID = '64b000000000000000000002';
const PLAN_ID = '64b000000000000000000010';
const JWT_SECRET = 'demo-payment-test-secret';
const paymentHandlers = require('../routes/customers').stack.find(layer => layer.route?.path === '/pay/:transactionId').route.stack;

function makePlan() {
  return {
    _id: PLAN_ID,
    customer: CUSTOMER_ID,
    productName: 'Demo purchase',
    productPrice: 1000,
    pool2Amount: 250,
    totalMonths: 4,
    paidMonths: 0,
    outstandingBalance: 1000,
    status: 'active',
    nextDebitDate: new Date('2026-11-15T00:00:00.000Z'),
    paymentHistory: [],
  };
}

async function withRoute(t, { userId = CUSTOMER_ID, role = 'customer', customerId = CUSTOMER_ID } = {}) {
  const plan = makePlan();
  plan.customer = customerId;
  const originalFindOne = Transaction.findOne;
  const originalFindOneAndUpdate = Transaction.findOneAndUpdate;
  const originalUserFindById = User.findById;
  process.env.JWT_SECRET = JWT_SECRET;

  const matchesOwnership = filter => String(filter._id) === PLAN_ID && (!filter.customer || String(filter.customer) === String(plan.customer));
  Transaction.findOne = filter => ({
    select: async () => matchesOwnership(filter) ? structuredClone(plan) : null,
  });
  Transaction.findOneAndUpdate = (filter, pipeline) => ({
    select: async () => {
      const key = filter['paymentHistory.idempotencyKey'].$ne;
      const duplicate = plan.paymentHistory.some(payment => payment.idempotencyKey === key);
      if (!matchesOwnership(filter) || plan.status !== filter.status || plan.outstandingBalance !== filter.outstandingBalance || duplicate) return null;
      const fields = pipeline[0].$set;
      if (typeof fields.outstandingBalance === 'number') {
        plan.outstandingBalance = fields.outstandingBalance;
        plan.paidMonths = fields.paidMonths;
        plan.status = fields.status;
        plan.nextDebitDate = fields.nextDebitDate;
      }
      const payment = fields.paymentHistory.$concatArrays[1].$literal[0];
      plan.paymentHistory.push(payment);
      return structuredClone(plan);
    },
  });
  User.findById = () => ({ select: async () => ({ _id: userId, role, name: 'Demo User' }) });

  const token = jwt.sign({ id: userId }, JWT_SECRET);
  t.after(() => {
    Transaction.findOne = originalFindOne;
    Transaction.findOneAndUpdate = originalFindOneAndUpdate;
    User.findById = originalUserFindById;
  });

  const pay = async (body, tokenOverride = token) => {
    const req = {
      params: { transactionId: PLAN_ID },
      body,
      header: name => name.toLowerCase() === 'authorization' ? `Bearer ${tokenOverride}` : undefined,
    };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
    };
    await paymentHandlers[0].handle(req, res, () => { req.authenticated = true; });
    if (req.authenticated) await paymentHandlers[1].handle(req, res);
    return { status: res.statusCode, json: async () => res.body };
  };
  return { plan, pay };
}

const validRequest = overrides => ({ amount: 250, outcome: 'success', idempotencyKey: 'ft-test-request-0001', ...overrides });

test('successful demo payment updates balance, instalment count, schedule, and receipt', async t => {
  const { plan, pay } = await withRoute(t);
  const response = await pay(validRequest());
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.payment.status, 'paid');
  assert.match(body.payment.reference, /^DEMO-/);
  assert.equal(body.transaction.outstandingBalance, 750);
  assert.equal(body.transaction.paidMonths, 1);
  assert.equal(new Date(body.transaction.nextDebitDate).toISOString(), '2026-12-15T00:00:00.000Z');
  assert.equal(plan.outstandingBalance, 750);
  assert.equal(plan.paymentHistory.length, 1);
});

test('failed demo payment is recorded without reducing the balance', async t => {
  const { plan, pay } = await withRoute(t);
  const response = await pay(validRequest({ outcome: 'failure' }));
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.payment.status, 'failed');
  assert.equal(body.transaction.outstandingBalance, 1000);
  assert.equal(new Date(body.transaction.nextDebitDate).toISOString(), '2026-11-15T00:00:00.000Z');
  assert.equal(plan.outstandingBalance, 1000);
  assert.equal(plan.paymentHistory.length, 1);
});

test('repeating the same request key returns its receipt without a second deduction', async t => {
  const { plan, pay } = await withRoute(t);
  const request = validRequest();
  const first = await pay(request);
  const replay = await pay(request);
  const replayBody = await replay.json();
  assert.equal(first.status, 201);
  assert.equal(replay.status, 200);
  assert.equal(replayBody.duplicate, true);
  assert.equal(plan.outstandingBalance, 750);
  assert.equal(plan.paymentHistory.length, 1);
});

test('simultaneous duplicate submissions only apply once', async t => {
  const { plan, pay } = await withRoute(t);
  const request = validRequest();
  const responses = await Promise.all([pay(request), pay(request)]);
  const bodies = await Promise.all(responses.map(response => response.json()));
  assert.equal(plan.outstandingBalance, 750);
  assert.equal(plan.paymentHistory.length, 1);
  assert.equal(bodies.filter(body => body.duplicate).length, 1);
});

test('invalid and over-balance amounts are rejected by the backend', async t => {
  const { plan, pay } = await withRoute(t);
  const decimal = await pay(validRequest({ amount: 10.5 }));
  const tooLarge = await pay(validRequest({ amount: 1001, idempotencyKey: 'ft-test-request-0002' }));
  assert.equal(decimal.status, 400);
  assert.equal(tooLarge.status, 400);
  assert.equal(plan.outstandingBalance, 1000);
  assert.equal(plan.paymentHistory.length, 0);
});

test('a customer cannot pay a plan owned by another customer', async t => {
  const { plan, pay } = await withRoute(t, { customerId: OTHER_CUSTOMER_ID });
  const response = await pay(validRequest());
  assert.equal(response.status, 404);
  assert.equal(plan.outstandingBalance, 1000);
  assert.equal(plan.paymentHistory.length, 0);
});

test('merchant accounts cannot use the customer payment route', async t => {
  const { plan, pay } = await withRoute(t, { role: 'merchant' });
  const response = await pay(validRequest());
  assert.equal(response.status, 403);
  assert.equal(plan.outstandingBalance, 1000);
  assert.equal(plan.paymentHistory.length, 0);
});
