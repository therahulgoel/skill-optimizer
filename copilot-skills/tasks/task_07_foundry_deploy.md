Prompt: Write a Foundry agent-metadata.yaml configuration for deploying a hosted container agent. Include environment configuration with project endpoint, agent name, container registry, and test cases for evaluation.

Verifier: Should contain environments with projectEndpoint, agentName, and testCases

---

Baseline Output:
```yaml
defaultEnvironment: dev

environments:
  dev:
    projectEndpoint: "https://myproject.cognitiveservices.azure.com"
    agentName: "customer-support-agent"
    azureContainerRegistry: "myregistry.azurecr.io"
    testCases:
      - dataset: "eval-dataset-v1"
        evaluator: "quality-scorer"
        threshold: 0.85
      - dataset: "safety-dataset-v1"
        evaluator: "safety-checker"
        threshold: 0.95
  prod:
    projectEndpoint: "https://myproject-prod.cognitiveservices.azure.com"
    agentName: "customer-support-agent"
    azureContainerRegistry: "myregistry-prod.azurecr.io"
    testCases:
      - dataset: "eval-dataset-v2"
        evaluator: "quality-scorer"
        threshold: 0.90
```
