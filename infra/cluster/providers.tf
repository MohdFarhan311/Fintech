# Tell Terraform which providers this project needs.
terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Connect Terraform to AWS using your configured AWS CLI credentials.
provider "aws" {
  # Use the region defined in terraform.tfvars.
  region = var.aws_region

  # Automatically tag supported resources.
  default_tags {
    tags = {
      Project     = "EKS-Learning"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}