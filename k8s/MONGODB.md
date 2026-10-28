# MongoDB on EKS

This learning deployment runs one `mongo:7.0` StatefulSet replica in the
`flextenure` namespace. The `mongodb` ClusterIP Service keeps port 27017 inside
the cluster. Configure the backend to use
`mongodb://<app-user>:<app-password>@mongodb.flextenure.svc.cluster.local:27017/flextenure?authSource=flextenure`.

## Storage behavior

`storage/mongodb-pvc.yaml` requests 10 GiB on the encrypted `gp3` StorageClass.
That is a reasonable starting size for this demo; EBS volumes can be expanded
later because the StorageClass allows expansion, but they do not shrink. The
PVC uses `ReadWriteOnce`, which allows the block volume to be mounted read/write
by one node at a time. It does not mean only one process on that node can use
it, so the StatefulSet is explicitly kept at one replica.

`WaitForFirstConsumer` delays volume creation and binding until Kubernetes
schedules the MongoDB pod. The EBS volume is then created in that node's
Availability Zone. EBS volumes are AZ-specific: if the node or AZ becomes
unavailable, Kubernetes cannot attach that volume to a node in another AZ.
This storage choice is not highly available and does not replace backups. The
StorageClass uses `Retain`, so deleting the PVC leaves its EBS volume behind;
do not delete the PVC as a cleanup shortcut.

## EBS CSI driver prerequisite

The current EKS cluster was checked read-only. `ebs.csi.aws.com` is absent from
the `CSIDriver` resources, and `kube-system` has no EBS CSI controller or node
pods. No Pod Identity Agent pod was running at inspection time. The
StorageClass and PVC therefore cannot provision storage yet. No AWS
infrastructure was changed.

Before applying the MongoDB StatefulSet, install the managed EKS add-on
`aws-ebs-csi-driver` with an IAM role for its `ebs-csi-controller-sa` service
account. EKS Pod Identity is the recommended option. The role trust policy must
allow `pods.eks.amazonaws.com` to call `sts:AssumeRole` and `sts:TagSession`;
attach the least-privilege EBS CSI policy recommended for the selected add-on
version (`AmazonEBSCSIDriverPolicyV2` is the current AWS recommendation for
tag-scoped access). The identity creating the Pod Identity association needs
`iam:PassRole`. The EKS Pod Identity Agent add-on must also be installed. If
using a customer-managed KMS key instead of the default EBS encryption key,
the driver role also needs the corresponding KMS grant and encryption
permissions.

Have the AWS administrator create the IAM role and attach its policy, then
install the Pod Identity Agent and EBS CSI add-on. For example, after the role
exists (replace the role ARN if needed):

```bash
aws eks create-addon \
  --cluster-name dev-eks-cluster \
  --addon-name eks-pod-identity-agent

aws eks create-addon \
  --cluster-name dev-eks-cluster \
  --addon-name aws-ebs-csi-driver \
  --pod-identity-associations '[{"serviceAccount":"ebs-csi-controller-sa","roleArn":"arn:aws:iam::ACCOUNT_ID:role/AmazonEKS_EBS_CSI_DriverRole"}]'
```

Check add-on status, then verify the driver registration and pods:

```bash
aws eks describe-addon --cluster-name dev-eks-cluster --addon-name aws-ebs-csi-driver
kubectl get csidriver ebs.csi.aws.com
kubectl get pods -n kube-system -o wide
```

Select the add-on version compatible with the actual cluster Kubernetes version
using `aws eks describe-addon-versions --addon-name aws-ebs-csi-driver`. If the
Pod Identity Agent is already installed, do not create it again. AWS's managed
add-on is preferred; first verify that no self-managed EBS CSI driver exists
before installing it.

See AWS's [EBS CSI installation and IAM guidance](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html),
[add-on IAM recommendations](https://docs.aws.amazon.com/eks/latest/userguide/retreive-iam-info.html),
and [Pod Identity setup](https://docs.aws.amazon.com/eks/latest/userguide/pod-id-association.html)
for the role trust policy and current add-on-specific requirements.

## MongoDB credentials and initialization

Compose environment variables map to a Kubernetes Secret named
`mongodb-credentials`, with keys `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`,
`MONGO_APP_USERNAME`, and `MONGO_APP_PASSWORD`. Create it from a protected
environment file that is not committed to Git:

```bash
kubectl create namespace flextenure
kubectl -n flextenure create secret generic mongodb-credentials \
  --from-env-file=/secure/path/mongodb-credentials.env
```

The env file should contain those four `KEY=value` entries. Protect it with
owner-only permissions (for example, `chmod 600`), and use the same root
credentials as any existing MongoDB data directory. The Mongo image only uses its `MONGO_INITDB_*` values
and runs `/docker-entrypoint-initdb.d` scripts when `/data/db` is empty; changing
those values does not rotate credentials in an already initialized database.

`mongodb.yaml` puts the first-time user creation script in a ConfigMap and
mounts only that file at the image's initialization-script directory. It does
not mount the Compose volume configuration wholesale. The separate
`mongodb-user-setup-job.yaml` is the Kubernetes replacement for Compose's
`database-setup` service: a one-shot Job waits for MongoDB and runs the
reconciliation logic from `mongo/setup.js`, including updating the app user's
password/role if the Job is intentionally rerun. A new Job name is required to
run that one-shot work again; use a version suffix when doing so.

The Compose named volume `mongo-data` is not mounted or imported here. The PVC
starts as a separate database. If that Compose volume contains data you need,
make a MongoDB backup and restore it into this PVC before routing the backend
to this Service; this setup does not modify the Compose volume or copy data
automatically.

## Apply after CSI is healthy

The current manifests intentionally are not applied yet because the required
driver is absent. After installing and checking the add-on, apply in order:

```bash
kubectl apply -f namespace.yaml
kubectl apply -f storage/storageclass.yaml
kubectl apply -f storage/mongodb-pvc.yaml
kubectl apply -f mongodb.yaml
kubectl -n flextenure get pvc mongodb-data -w
kubectl -n flextenure get statefulset,pod,service
kubectl apply -f mongodb-user-setup-job.yaml
kubectl -n flextenure logs job/mongodb-user-setup-v1
```

Wait for the PVC to become `Bound` and the pod to become ready before running
the setup Job. Keep the one replica: this is not a highly available MongoDB
configuration. The PVC and retained EBS volume hold the database data; changing
or recreating the pod does not itself remove that data.
