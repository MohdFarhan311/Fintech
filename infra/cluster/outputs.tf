# Show the VPC ID.
output "vpc_id" {
  value = module.vpc.vpc_id
}

# Show the public subnet IDs.
output "public_subnet_ids" {
  value = module.vpc.public_subnets
}

# Show the private subnet IDs.
output "private_subnet_ids" {
  value = module.vpc.private_subnets
}

# Show the NAT Gateway public IP.
output "nat_gateway_public_ips" {
  value = module.vpc.nat_public_ips
}

# Show the EKS cluster name.
output "eks_cluster_name" {
  value = module.eks.cluster_name
}

# Show the Kubernetes API endpoint.
output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

# Show the EKS control plane security group.
output "eks_cluster_security_group_id" {
  value = module.eks.cluster_security_group_id
}

# Show the EC2 worker node security group.
output "eks_node_security_group_id" {
  value = module.eks.node_security_group_id
}