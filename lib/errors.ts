export function friendlyFirebaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  if (message.includes("requires an index")) {
    return "Firestore is still preparing this list. Deploy the indexes in firestore.indexes.json, wait until they are enabled, then reload.";
  }
  if (message.includes("Missing or insufficient permissions")) {
    return "Firestore blocked this. Deploy the firestore.rules file from this project, then reload.";
  }
  return message;
}

export function friendlyAuthError(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with that email already exists. Log in instead.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Use a password of at least 8 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password do not match.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google window. Allow pop-ups and try again.";
    case "auth/popup-closed-by-user":
      return "The Google window was closed before sign-in finished.";
    case "auth/unauthorized-domain":
      return "This website is not an authorized domain in Firebase Authentication. Add it, then try again.";
    default:
      return error instanceof Error ? error.message : "Something went wrong.";
  }
}
