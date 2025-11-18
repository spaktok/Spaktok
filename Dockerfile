# 1. Use secure Node.js 20 Alpine image for minimal attack surface
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /usr/src/app

# 3. Copy package.json and package-lock.json from the 'functions' directory
COPY functions/package*.json ./

# 4. Install Firebase CLI and function dependencies
RUN npm install -g firebase-tools && npm install

# 5. Copy all the function source code
COPY functions/ ./

# 6. Expose the port the Firebase emulator will run on (optional, for local testing)
EXPOSE 5001

# 7. Set the default command to run when the container starts
# This is primarily for local emulation. For deployment, you would use a CI/CD pipeline.
CMD ["firebase", "emulators:start", "--only", "functions,firestore", "--inspect-functions"]
