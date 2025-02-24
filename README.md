# Sentiment-Analysis-v2 - By Zakaria Kortam

Real-time sentiment analysis with FastAPI, Kubernetes, and GitOps

## Overview

**sentiment-analysis-v2** is a cloud-native application that performs real-time sentiment analysis on user input. The application uses a Logistic Regression model (trained on synthetic data) and serves predictions via a FastAPI REST API. The application is containerized with Docker and deployed on a Kubernetes cluster managed by AWS EKS. Continuous deployment is automated through GitOps (using GitHub Actions and/or ArgoCD).

## Tech Stack

- **Backend API:** FastAPI, Uvicorn
- **Machine Learning:** scikit-learn (Logistic Regression), joblib, pandas, numpy
- **Containerization:** Docker
- **Orchestration:** Kubernetes (AWS EKS)
- **CI/CD / GitOps:** GitHub Actions, ArgoCD (optional)
- **Cloud Provider:** AWS (ECR, EKS, ELB)

## Prerequisites

Before you begin, ensure you have the following installed and configured on your local machine:

- **Python 3.9+**
- **Docker Desktop** (with support for Linux containers)
- **kubectl**
- **AWS CLI** (configured with appropriate credentials)
- **eksctl** (for managing EKS clusters)
- **GitHub Account & Repository**

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/sentiment-analysis-v2.git
cd sentiment-analysis-v2
```

### 2. Install Python Dependencies

Inside the `app` folder, create a virtual environment and install required packages:

```bash
cd app
python -m venv venv
source venv/bin/activate   # On Windows use: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Train the Model

Run the training script to generate a trained model (`sentiment.pkl`) and vectorizer:

```bash
python train.py
```

This script creates a synthetic dataset with 30 positive and 30 negative templates, trains a Logistic Regression model, and saves it to `app/sentiment.pkl`.

### 4. Build the Docker Image

Return to the project root and build your Docker image. Make sure to build it for the correct platform:

```bash
docker build --platform linux/amd64 -t sentiment-analysis:latest .
```

### 5. Push the Image to AWS ECR

1. **Create an ECR repository (if not already created):**

   ```bash
   aws ecr create-repository --repository-name sentiment-analysis --region us-east-2
   ```

   Note the repository URI from the output (e.g., `677276084635.dkr.ecr.us-east-2.amazonaws.com/sentiment-analysis`).

2. **Authenticate Docker with ECR:**

   ```bash
   aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 677276084635.dkr.ecr.us-east-2.amazonaws.com
   ```

3. **Tag and push your image:**

   ```bash
   docker tag sentiment-analysis:latest 677276084635.dkr.ecr.us-east-2.amazonaws.com/sentiment-analysis:latest
   docker push 677276084635.dkr.ecr.us-east-2.amazonaws.com/sentiment-analysis:latest
   ```

### 6. Deploy to AWS EKS

1. **Create an EKS Cluster:**

   Use eksctl to create a cluster (ensure you have eksctl installed):

   ```bash
   eksctl create cluster \
     --name sentiment-cluster \
     --version 1.32 \
     --region us-east-2 \
     --nodegroup-name standard-workers \
     --node-type t3.medium \
     --nodes 3 \
     --nodes-min 1 \
     --nodes-max 4 \
     --managed
   ```

   Verify your cluster with:

   ```bash
   kubectl get nodes
   ```

2. **Configure Kubernetes Manifests:**

   - **Deployment (k8s/deployment.yaml):**

     ```yaml
     apiVersion: apps/v1
     kind: Deployment
     metadata:
       name: sentiment-analysis-deployment
       labels:
         app: sentiment-analysis
     spec:
       replicas: 3
       selector:
         matchLabels:
           app: sentiment-analysis
       template:
         metadata:
           labels:
             app: sentiment-analysis
         spec:
           containers:
           - name: sentiment-analysis
             image: 677276084635.dkr.ecr.us-east-2.amazonaws.com/sentiment-analysis:latest
             ports:
             - containerPort: 80
             readinessProbe:
               httpGet:
                 path: /
                 port: 80
               initialDelaySeconds: 5
               periodSeconds: 10
     ```

   - **Service (k8s/service.yaml):**

     ```yaml
     apiVersion: v1
     kind: Service
     metadata:
       name: sentiment-analysis-service
     spec:
       selector:
         app: sentiment-analysis
       ports:
         - protocol: TCP
           port: 80
           targetPort: 80
       type: LoadBalancer
     ```

3. **Deploy the Manifests:**

   ```bash
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   ```

   Verify your deployment:

   ```bash
   kubectl get pods
   kubectl get svc sentiment-analysis-service
   ```

4. **Test the Application:**

   Once the LoadBalancer is provisioned and an external DNS is assigned, test the API:

   ```bash
   curl -X POST http://<EXTERNAL-DNS>/predict \
     -H "Content-Type: application/json" \
     -d '{"text": "I love this product"}'
   ```

   Replace `<EXTERNAL-DNS>` with the value from `kubectl get svc sentiment-analysis-service`.

### 7. Set Up CI/CD Automation with GitHub Actions (Optional)

Automate your build and deployment process using GitHub Actions:

1. **Add AWS Credentials to GitHub Secrets:**
   - Go to your GitHub repository → Settings → Secrets and Variables → Actions.
   - Add the following secrets:
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`
     - `AWS_REGION` (e.g., `us-east-2`)

2. **Create the Workflow File:**

   Create `.github/workflows/deploy.yml` with the following content:

   ```yaml
   name: Deploy to AWS EKS

   on:
     push:
       branches:
         - main

   jobs:
     deploy:
       runs-on: ubuntu-latest

       steps:
         - name: Checkout Code
           uses: actions/checkout@v3

         - name: Configure AWS Credentials
           uses: aws-actions/configure-aws-credentials@v2
           with:
             aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
             aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
             aws-region: ${{ secrets.AWS_REGION }}

         - name: Authenticate Docker to AWS ECR
           run: |
             aws ecr get-login-password --region ${{ secrets.AWS_REGION }} | docker login --username AWS --password-stdin 677276084635.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com

         - name: Build Docker Image
           run: |
             docker build --platform linux/amd64 -t sentiment-analysis:latest .

         - name: Tag Docker Image for ECR
           run: |
             docker tag sentiment-analysis:latest 677276084635.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com/sentiment-analysis:latest

         - name: Push Docker Image to ECR
           run: |
             docker push 677276084635.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com/sentiment-analysis:latest

         - name: Update Kubernetes Deployment
           run: |
             aws eks update-kubeconfig --name sentiment-cluster --region ${{ secrets.AWS_REGION }}
             kubectl set image deployment/sentiment-analysis-deployment sentiment-analysis=677276084635.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com/sentiment-analysis:latest
             kubectl rollout status deployment/sentiment-analysis-deployment
   ```

3. **Commit and Push:**

   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add CI/CD workflow for EKS deployment"
   git push origin main
   ```

4. **Monitor the Workflow:**

   Go to the "Actions" tab in your GitHub repository and verify the workflow completes successfully.

---

## Additional Considerations

- **Monitoring & Logging:**  
  Set up AWS CloudWatch or integrate Prometheus/Grafana for monitoring metrics and logs.

- **Security:**  
  Use IAM roles with least privilege, secure your GitHub secrets, and consider using a private container registry if needed.

- **Scaling:**  
  Configure Horizontal Pod Autoscaling (HPA) to scale your application automatically based on CPU/memory usage.

- **Custom Domains & SSL:**  
  For production, consider setting up a custom domain (via Route 53) and SSL certificates (via AWS Certificate Manager) along with an Ingress Controller.

---

## Conclusion

You now have a full end-to-end setup for **sentiment-analysis-v2**:

- **FastAPI application** that provides real-time sentiment analysis.
- **Containerized** with Docker, built for the correct architecture.
- **Deployed** to AWS EKS using Kubernetes manifests.
- **Automated** via GitOps with GitHub Actions (optional).
