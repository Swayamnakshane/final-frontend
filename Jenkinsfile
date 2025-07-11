pipeline {
    agent any
    environment {
        SONAR_HOME = tool "sonar"
    }
    stages {
        stage("code") {
            steps {
                git url: "https://github.com/Swayamnakshane/final-frontend.git", branch: "front"
            }
        }
        stage("SonarQube Analysis") {
            steps {
                withSonarQubeEnv("sonar") {
                    sh """
                        ${SONAR_HOME}/bin/sonar-scanner \
                        -Dsonar.projectName=myfront1 \
                        -Dsonar.projectKey=myfront1
                    """
                }
            }
        }

        stage("build") {
            steps {
                sh "docker build -t myfront1:latest ."
            }
        }
        stage("trivy") {
            steps {
                sh "trivy fs --format table -o trivy-fs-report.html ."
            }
        }

        stage("dockerhub push") {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "dockerhubcred",
                    usernameVariable: "dockerHubUser",
                    passwordVariable: "dockerHubPass"
                )]) {
                    sh "docker login -u $dockerHubUser -p $dockerHubPass"
                    sh "docker tag myfront1 $dockerHubUser/myfront1:latest"
                    sh "docker push $dockerHubUser/myfront1:latest"
                }
            }
        }
    }
}
