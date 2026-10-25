# AWS region where the resources will be created.
variable "aws_region" {
  type    = string
  default = "us-east-1"
}

# Environment name used in resource names and tags.
variable "environment" {
  type    = string
  default = "dev"
}

# Name of the Kubernetes cluster.
variable "cluster_name" {
  type    = string
  default = "dev-eks-cluster"
}

# Kubernetes version; confirm regional availability before deployment.
variable "cluster_version" {
  type    = string
  default = "1.35"
}

# IP address range available inside the VPC.
variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

# Public IP ranges allowed to connect to the Kubernetes API.
variable "admin_cidr_blocks" {
  type        = list(string)
  description = "Your public IPv4 address in CIDR format, for example 203.0.113.10/32"
}

# Minimum number of EC2 worker nodes.
variable "min_nodes" {
  type    = number
  default = 1
}

# Maximum number of EC2 worker nodes.
variable "max_nodes" {
  type    = number
  default = 2
}

# Number of worker nodes to start with.
variable "desired_nodes" {
  type    = number
  default = 1
}