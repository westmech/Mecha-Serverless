import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { prompt } from "enquirer";

const createDir = (dirPath: string): void => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(`${dirPath}`, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    } else {
        console.log(`Directory already exists: ${dirPath}`);
    }
};

const createFile = (filePath: string, content: string): void => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
        console.log(`Created file: ${filePath}`);
    } else {
        console.log(`File already exists: ${filePath}`);
    }
};

const runCommand = (command: string): void => {
    console.log(`Running command: ${command}`);
    try {
        execSync(command, { stdio: "inherit" });
    } catch (error) {
        console.error(`Command failed: ${command}`);
        process.exit(1);
    }
};

// main script

async function main() {
    const { serviceName } = await prompt<{ serviceName: string }>({
        type: "input",
        name: "serviceName",
        message: "Enter the service name (e.g., my-new-service):",
    });
    const servicePath = path.join('services', serviceName);

    createDir(servicePath);
    process.chdir(servicePath);

    const handlerContent = `
export const test = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ status: "OK" })
  };
};
`;
    createFile("handler.ts", handlerContent);

    const serverlessContent = `
frameworkVersion: "4"

service: ${serviceName}

provider:
    name: aws
    runtime: nodejs20.x
    httpApi:
        disableDefaultEndpoint: true

functions:
    getYear:
        handler: handler.test
        events:
            - http:
                  path: ${serviceName}/test
                  method: get
                  cors: true

plugins:
    - serverless-offline

custom:
    serverless-offline:
        lambdaPath: ./dist
        noPrependStageInUrl: true
        servicePath: \${__dirname}

`;
    createFile("serverless.yml", serverlessContent);

    const packageJsonContent = `
{
  "name": "${serviceName}",
  "version": "1.0.0",
  "description": "Serverless service for ${serviceName}",
    "main": "handler.js",
    "scripts": {
        "test": "echo \\\"Error: no test specified\\\" && exit 1",
        "build": "tsc",
        "dev": "npm run build && npx sls offline"
    },
    "author": "",
    "license": "ISC",
    "devDependencies": {
        "@types/express": "^5.0.1",
        "@types/node": "^22.15.3",
        "express": "^4.19.2",
        "formidable": "^3.5.4",
        "jsonpath-plus": "^10.3.0",
        "jsonwebtoken": "^9.0.2",
        "superagent": "^10.2.0",
        "serverless": "^4.14.2",
        "serverless-offline": "^14.4.0",        
        "serverless-http": "^3.2.0",
        "ts-node": "^10.9.2",
        "typescript": "^5.8.3"
    }
}

`;
    createFile("package.json", packageJsonContent);

    const tsconfigContent = `
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "sourceMap": true
  }
}
`;
    createFile("tsconfig.json", tsconfigContent);

    runCommand("npm install");

    console.log(
        `Serverless service '${serviceName}' has been successfully created.`
    );
    console.log("Registering service to gateways...");
    try {
        const serverlessYamlPath = path.join(
            process.cwd(),
            "../../sls-multi-gateways.yml"
        );
        const serviceConfig = `
    - srvName: ${serviceName}
    srvPath: ${serviceName}
    srvSource: services/${serviceName}
`;
        fs.appendFileSync(serverlessYamlPath, `\n${serviceConfig}`);
        console.log("Appended service configuration to serverless.yml");
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error modifying serverless.yml:", error.message);
        } else {
            console.error("Error modifying serverless.yml:", error);
        }
        process.exit(1);
    }

    runCommand("npm run build");

    console.log("You can now:");
    console.log(`  1.  cd ${serviceName}`);
    console.log("  2.  Run 'npm run dev' to start the local server.");
}

main();
