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
        // stage("SonarQube Analysis") {
        //     steps {
        //         withSonarQubeEnv("sonar") {
        //             sh """
        //                 ${SONAR_HOME}/bin/sonar-scanner \
        //                 -Dsonar.projectName=myfront2 \
        //                 -Dsonar.projectKey=myfront2
        //             """
        //         }
        //     }
        // }

        stage("build") {
            steps {
                sh "docker build -t myfront3:latest ."
            }
        }
        // stage("trivy") {
        //     steps {
        //         sh "trivy fs --format table -o trivy-fs-report.html ."
        //     }
        // }

        stage("dockerhub push") {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "dockerhubcred",
                    usernameVariable: "dockerHubUser",
                    passwordVariable: "dockerHubPass"
                )]) {
                    sh "docker login -u $dockerHubUser -p $dockerHubPass"
                    sh "docker tag myfront3 $dockerHubUser/myfront3:latest"
                    sh "docker push $dockerHubUser/myfront3:latest"
                }
            }
        }
    }
}
