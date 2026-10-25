# Region for the VPC and EKS cluster.
aws_region = "us-east-1"

# Environment name for resource names and tags.
environment = "dev"

# EKS cluster name.
cluster_name = "dev-eks-cluster"

# Check that this Kubernetes version is supported in your region.
cluster_version = "1.35"

# VPC address range.
vpc_cidr = "10.0.0.0/16"

# Replace this with your current public IP address.
admin_cidr_blocks = ["YOUR_PUBLIC_IP/32"]

# Start with one worker node.
desired_nodes = 1

# Do not scale below one worker node.
min_nodes = 1

# Allow up to two worker nodes.
max_nodes = 2