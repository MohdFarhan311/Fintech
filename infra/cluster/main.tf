terraform {
  # Store the cluster's Terraform state in the S3 bucket created by bootstrap.
  backend "s3" {
    # Replace this with the bucket name printed by bootstrap.
    bucket = "REPLACE-WITH-YOUR-STATE-BUCKET"

    # Path to this project's state object inside S3.
    key = "eks-learning/terraform.tfstate"

    # Region where the state bucket exists.
    region = "us-east-1"

    # Enable native S3 state locking; no DynamoDB table is needed.
    use_lockfile = true

    # Encrypt the state object at rest.
    encrypt = true
  }
}

# Discover Availability Zones that do not require opt-in.
data "aws_availability_zones" "available" {
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }

  # Include only zones currently available for use.
  state = "available"
}

# Reuse the first three Availability Zones.
locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}

# Create the VPC and its public/private subnets.
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  # Name the VPC using the environment variable.
  name = "${var.environment}-vpc"

  # Set the VPC's IP address range.
  cidr = var.vpc_cidr

  # Place subnets across three Availability Zones.
  azs = local.azs

  # Create private /20 subnets for EC2 worker nodes.
  private_subnets = [
    for k, v in local.azs : cidrsubnet(var.vpc_cidr, 4, k)
  ]

  # Create public /24 subnets for internet-facing resources.
  public_subnets = [
    for k, v in local.azs : cidrsubnet(var.vpc_cidr, 8, k + 48)
  ]

  # Create a NAT Gateway for outbound internet access from private subnets.
  enable_nat_gateway = true

  # Share one NAT Gateway across the private subnets to reduce cost.
  single_nat_gateway = true

  # Tag public subnets for external load balancers.
  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  # Tag private subnets for internal load balancers.
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# Create the managed EKS cluster.
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.31"

  # Name and Kubernetes version of the cluster.
  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  # Deploy EKS networking into our VPC.
  vpc_id = module.vpc.vpc_id

  # Place the cluster networking and EC2 worker nodes in private subnets.
  subnet_ids = module.vpc.private_subnets

  # Allow Kubernetes API access through the public endpoint.
  cluster_endpoint_public_access = true

  # Restrict public API access to the supplied IP addresses.
  cluster_endpoint_public_access_cidrs = var.admin_cidr_blocks

  # Also enable API access from within the VPC.
  cluster_endpoint_private_access = true

  # Use EKS API access entries and the legacy aws-auth ConfigMap.
  authentication_mode = "API_AND_CONFIG_MAP"

  # Give the identity creating this cluster administrative access.
  enable_cluster_creator_admin_permissions = true

  # Create a managed EC2 worker node group.
  eks_managed_node_groups = {
    workers = {
      # A small node type; see the memory warning below.
      instance_types = ["t3.small"]

      # Use the Amazon Linux 2023 EKS-optimized AMI.
      ami_type = "AL2023_x86_64_STANDARD"

      # Start with one EC2 instance.
      desired_size = var.desired_nodes

      # Keep at least one instance available.
      min_size = var.min_nodes

      # Allow at most two instances.
      max_size = var.max_nodes

      # Run the worker nodes in private subnets.
      subnet_ids = module.vpc.private_subnets
    }
  }

  # Tag supported EKS resources.
  tags = {
    Project     = "EKS-Learning"
    Environment = var.environment
  }
}