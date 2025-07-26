#!/bin/bash
# GCP auth
gcloud auth application-default login
gcloud config set project phading-prod

# Create service account
gcloud iam service-accounts create play-activity-service-builder

# Grant permissions to the service account
gcloud projects add-iam-policy-binding phading-prod --member="serviceAccount:play-activity-service-builder@phading-prod.iam.gserviceaccount.com" --role='roles/cloudbuild.builds.builder' --condition=None
gcloud projects add-iam-policy-binding phading-prod --member="serviceAccount:play-activity-service-builder@phading-prod.iam.gserviceaccount.com" --role='roles/container.developer' --condition=None
gcloud projects add-iam-policy-binding phading-prod --member="serviceAccount:play-activity-service-builder@phading-prod.iam.gserviceaccount.com" --role='roles/spanner.databaseAdmin' --condition=None

# Set k8s cluster
gcloud container clusters get-credentials phading-cluster --location=us-central1

# Create the service account
kubectl create serviceaccount play-activity-service-account --namespace default

# Grant database permissions to the service account
gcloud projects add-iam-policy-binding phading-prod --member=principal://iam.googleapis.com/projects/703213718960/locations/global/workloadIdentityPools/phading-prod.svc.id.goog/subject/ns/default/sa/play-activity-service-account --role=roles/spanner.databaseUser --condition=None
gcloud projects add-iam-policy-binding phading-prod --member=principal://iam.googleapis.com/projects/703213718960/locations/global/workloadIdentityPools/phading-prod.svc.id.goog/subject/ns/default/sa/play-activity-service-account --role=roles/bigtable.user --condition=None

# Create Spanner database
gcloud spanner databases create play-activity-db --instance=balanced-db-instance

# Create Bigtable table
cbt -project phading-prod -instance single-instance createtable play-activity-table
cbt -project phading-prod -instance single-instance createfamily play-activity-table w:maxversions=1
