import { clearStack, connectLogger, context } from "@reatom/core";

/**
 * Единый корневой фрейм приложения (см. «Setup context» в README @reatom/react).
 */
clearStack();

export const rootFrame = context.start();

if (import.meta.env.DEV) {
  rootFrame.run(connectLogger);
}
