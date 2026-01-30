import { matcher } from '../middleware';

// Simulation of the User's current middleware matcher
// The user has: '/((?!_next|.*\\..*|auth/sign-in|auth/sign-up).*)'

const requestedPath = '/auth/sign-in';
const userMatcherRegex = /((?!_next|.*\\..*|auth\/sign-in|auth\/sign-up).*)/;

console.log(`Testing path: ${requestedPath}`);
const isMatch = userMatcherRegex.test(requestedPath);

console.log(`Does middleware run on ${requestedPath}? ${isMatch}`);

if (!isMatch) {
    console.error("CRITICAL ISSUE: Middleware is NOT running on the sign-in page.");
    console.error("Clerk requires middleware to run on sign-in pages to handle the handshake and session limits.");
    console.error("This explains why the page fails to load or redirect correctly - the Clerk context is missing.");
} else {
    console.log("Middleware matches. Investigating other causes...");
}
