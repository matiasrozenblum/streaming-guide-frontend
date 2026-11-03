"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  IconButton,
  Box,
  Button,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { signIn, useSession } from "next-auth/react";
import EmailStep from "./steps/EmailStep";
import CodeStep from "./steps/CodeStep";
import ProfileStep from "./steps/ProfileStep";
import PasswordStep from "./steps/PasswordStep";
import ExistingUserStep from "./steps/ExistingUserStep";
import { useDeviceId } from "@/hooks/useDeviceId";
import { event as gaEvent } from "@/lib/gtag";
import { useTooltip } from "@/contexts/TooltipContext";
import GoogleIcon from "@mui/icons-material/Google";
import AppleIcon from "@mui/icons-material/Apple";
// import FacebookIcon from '@mui/icons-material/Facebook'; // Temporarily disabled - requires app review
import CircularProgress from "@mui/material/CircularProgress";
import { buildLegalConsentEntry } from "@/constants/legal";

// Helper para extraer mensaje de Error
function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

type StepKey = "email" | "code" | "profile" | "password" | "existing-user";

const ALL_STEPS: Record<"new" | "existing", StepKey[]> = {
  new: ["email", "code", "profile", "password"],
  existing: ["email", "existing-user"],
};
const STEP_LABELS: Record<StepKey, string> = {
  email: "Correo",
  code: "Verificar",
  profile: "Perfil",
  password: "Contraseña",
  "existing-user": "Acceso",
};

// Custom StepIcon that uses your icons and colors them blue for active/completed steps

const mapGenderToBackend = (g: string) => {
  switch (g) {
    case "masculino":
      return "male";
    case "femenino":
      return "female";
    case "no_binario":
      return "non_binary";
    case "prefiero_no_decir":
      return "rather_not_say";
    default:
      return "rather_not_say";
  }
};

// Add global type for window.__socialLoginHandled
declare global {}

export default function LoginModal({
  open,
  onClose,
  variant = "dialog",
  onPhaseChange,
}: {
  open: boolean;
  onClose: () => void;
  /**
   * Fires when the form moves from asking for an e-mail to the steps that
   * follow. The signed-out page listens so it can give the form the whole
   * screen: those steps need room the pitch is holding.
   */
  onPhaseChange?: (phase: "email" | "flow") => void;
  /**
   * "dialog" floats over whatever page you were on. "inline" drops the same
   * steps into the layout, for the signed-out /mi-resumen, where the form is
   * not an interruption — it is the content of that half of the screen.
   */
  variant?: "dialog" | "inline";
}) {
  const deviceId = useDeviceId();
  const { closeTooltip } = useTooltip();
  const { data: session, status: sessionStatus } = useSession();

  const [step, setStep] = useState<StepKey>("email");
  const [isUserExisting, setIsUserExisting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userGender, setUserGender] = useState("");
  const [phase, setPhase] = useState<"email" | "flow">("email");
  const [socialLoginPending, setSocialLoginPending] = useState(false);
  /**
   * The last step is done when the password is accepted, not when it is shown.
   * Without this the bar would be full while the form is still empty, and the
   * one moment the sign-up is actually finished would have nothing to show.
   */
  const [flowComplete, setFlowComplete] = useState(false);

  useEffect(() => {
    // Inline it never closes, so there is nothing to reset: leaving this on
    // `open` alone would wipe the form the moment it mounted.
    if (!open && variant === "dialog") {
      setStep("email");
      setIsUserExisting(false);
      setEmail("");
      setCode("");
      setRegistrationToken("");
      setFirstName("");
      setLastName("");
      setError("");
      setIsLoading(false);
      setForgotPassword(false);
      setBirthDate("");
      setGender("");
      setUserFirstName("");
      setUserGender("");
      setPhase("email");
      setSocialLoginPending(false);
      setFlowComplete(false);
    }
  }, [open, variant]);

  /**
   * Back to the e-mail panel with the address still in hand, which is both
   * what "Cambiar correo" means and where the header arrow goes from the first
   * step of the flow.
   */
  const returnToEmail = () => {
    setError("");
    setCode("");
    setForgotPassword(false);
    setIsUserExisting(false);
    setStep("email");
    setPhase("email");
  };

  /** One step back, following the same path each step's own button takes. */
  const goBack = () => {
    setError("");
    if (step === "existing-user") return returnToEmail();
    if (forgotPassword && step === "code") {
      setForgotPassword(false);
      setStep("existing-user");
      return;
    }
    if (forgotPassword && step === "password") return setStep("code");
    const index = steps.indexOf(step);
    if (index <= 0) return returnToEmail();
    /**
     * Landing on the e-mail step means leaving the flow, not just moving the
     * cursor: the e-mail field renders in the other phase, so setting the step
     * alone left the panel with nothing in it.
     */
    const previous = steps[index - 1];
    if (previous === "email") return returnToEmail();
    setStep(previous);
  };

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // Track social login success when session becomes authenticated
  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user) {
      // Check if this was a social login by looking at sessionStorage
      const socialProvider = sessionStorage.getItem("lastSocialProvider");
      if (socialProvider) {
        // Clear the sessionStorage
        sessionStorage.removeItem("lastSocialProvider");

        // For existing users, track login success immediately
        // For new users, we'll track signup success when they reach profile completion
        if (window.location.pathname !== "/profile-completion") {
          gaEvent({
            action: "social_login_success",
            params: {
              provider: socialProvider,
              method: "social_login",
              user_type: "existing",
            },
          });
        }
      }
    }
  }, [session, sessionStatus]);

  // Track modal open and close tooltips
  useEffect(() => {
    if (open) {
      closeTooltip(); // Close all tooltips when modal opens
      gaEvent({
        action: "auth_modal_open",
        params: {
          is_existing_user: isUserExisting,
        },
      });
    }
  }, [open, isUserExisting, closeTooltip]);

  // Track step changes (for funnel analysis)
  useEffect(() => {
    if (open) {
      gaEvent({
        action: "auth_step_change",
        params: {
          step,
          is_existing_user: isUserExisting,
          has_error: !!error,
        },
      });
    }
  }, [step, open, isUserExisting, error]);

  const steps = isUserExisting ? ALL_STEPS.existing : ALL_STEPS.new;
  const activeStep = steps.indexOf(step);

  // Track signup step complete (for funnel)
  const trackSignupStep = (stepName: string, extraParams = {}) => {
    gaEvent({
      action: "signup_step_complete",
      params: {
        step: stepName,
        email_provided: !!email,
        has_first_name: !!firstName,
        has_last_name: !!lastName,
        has_birth_date: !!birthDate,
        has_gender: !!gender,
        ...extraParams,
      },
    });
  };

  // Remove popup-based social login handler
  // const handleSocialLogin = async (provider: 'google' | 'facebook') => { ... };

  /**
   * The steps themselves, with no shell around them. The auth flow is the
   * one piece of this app that must not exist twice — the signed-out
   * version of /mi-resumen shows this very form as its right-hand column,
   * so it is the same component with a different wrapper, not a copy.
   */
  const content = (
    <>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          // With the arrow in front, the title belongs beside it; pushed apart
          // it drifted to the far edge and read as a right-aligned heading.
          justifyContent:
            variant === "inline" ? "flex-start" : "space-between",
          gap: variant === "inline" ? 0.5 : 0,
          px: 3,
          py: 2,
          backgroundColor: "#0F172A",
        }}
      >
        {phase === "email"
          ? "¡Bienvenid@ a La Guía!"
          : isUserExisting && step === "existing-user"
            ? "Iniciar Sesión"
            : !isUserExisting && step === "email"
              ? "Acceder / Registrarse"
              : step === "code"
                ? forgotPassword
                  ? "Recuperar contraseña"
                  : "Verificar correo"
                : step === "profile"
                  ? "Completa tu perfil"
                  : step === "password"
                    ? forgotPassword
                      ? "Nueva contraseña"
                      : "Creá tu contraseña"
                    : ""}
        {/* The way back is the arrow, in both shapes. The cross is the way
            out, which is a different thing: somebody who mistyped a step does
            not want to lose the three they already filled in. Inline there is
            no cross, because there is nothing to close. */}
        {phase === "flow" && (
          <IconButton
            aria-label="Volver"
            onClick={socialLoginPending ? undefined : goBack}
            sx={{ order: -1, ml: -1, mr: 0.5 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        {variant === "dialog" && (
          <Tooltip title="Cerrar modal" arrow>
            <IconButton
              aria-label="Cerrar modal"
              onClick={socialLoginPending ? undefined : onClose}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        )}
      </DialogTitle>

      {
        <>
          {phase === "flow" && !isUserExisting && (
            /**
             * One bar that fills, in place of the stepper with icons and labels
             * under each one. That one needs room a 390px screen does not have,
             * and nobody reads "Paso 2 de 4 · Verificar" as anything but
             * paperwork — the heading right above it already says which step
             * this is, so the sentence was saying it twice in worse words. What
             * the bar adds is the part the heading cannot show: how much is
             * left. The progress is announced instead of drawn, so a screen
             * reader still gets the count the sentence used to carry.
             *
             * Only while signing up. Somebody who already has an account types
             * an address and then a password: there is no journey to chart, and
             * the recovery branch is not in `ALL_STEPS.existing` at all, so the
             * bar there would measure against a list it is not part of.
             */
            <Box sx={{ px: 3, pt: 2 }}>
              <Box
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={steps.length}
                aria-valuenow={flowComplete ? steps.length : activeStep}
                aria-valuetext={
                  flowComplete
                    ? "Listo"
                    : `Paso ${activeStep + 1} de ${steps.length}: ${
                        STEP_LABELS[steps[activeStep] ?? steps[0]]
                      }`
                }
                sx={{
                  height: 4,
                  borderRadius: "2px",
                  backgroundColor: "#1E293B",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    borderRadius: "inherit",
                    backgroundColor: "primary.main",
                    /**
                     * Steps left behind, not the one in front of you: standing
                     * on the last step is three quarters of the way, and the
                     * bar closes when that step is accepted.
                     */
                    width: `${
                      ((flowComplete ? steps.length : activeStep) /
                        steps.length) *
                      100
                    }%`,
                    transition: "width .32s cubic-bezier(.22,1,.36,1)",
                  }}
                />
              </Box>
            </Box>
          )}

          <DialogContent sx={{ px: 3, py: 2, backgroundColor: "#0F172A" }}>
            {phase === "email" && (
              <>
                <EmailStep
                  initialEmail={email}
                  isLoading={isLoading}
                  error={error}
                  onSubmit={async (e) => {
                    setIsLoading(true);
                    setError("");
                    setEmail(e);
                    try {
                      const res = await fetch(`/api/users/email/${e}`);
                      if (res.ok) {
                        const userData = await res.json();
                        setUserFirstName(userData.firstName || "");
                        setUserGender(userData.gender || "");
                        setIsUserExisting(true);

                        // Check if user registered via social login
                        if (
                          userData.origin &&
                          userData.origin !== "traditional"
                        ) {
                          // Automatically trigger social login for the detected provider
                          const provider =
                            userData.origin === "google"
                              ? "google"
                              : "facebook";
                          setSocialLoginPending(true);
                          // Store provider in sessionStorage for tracking
                          sessionStorage.setItem(
                            "lastSocialProvider",
                            provider,
                          );
                          // Track social login attempt
                          gaEvent({
                            action: "social_login_attempt",
                            params: {
                              provider: provider,
                              method: "auto_redirect",
                            },
                          });
                          // Automatically trigger the social login
                          await signIn(provider, {
                            callbackUrl: "/profile-completion",
                          });
                          setSocialLoginPending(false);
                          return; // Exit early to prevent further processing
                        } else {
                          // Regular email user, proceed to password step
                          setStep("existing-user");
                          setPhase("flow");
                        }
                      } else if (res.status === 404) {
                        setIsUserExisting(false);
                        await fetch("/api/auth/send-code", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ identifier: e }),
                        });
                        setStep("code");
                        setPhase("flow");
                      } else {
                        throw new Error("Error inesperado");
                      }
                    } catch (err: unknown) {
                      setError(getErrorMessage(err));
                    }
                    setIsLoading(false);
                  }}
                />
                {/* Social login separator */}
                <Box sx={{ display: "flex", alignItems: "center", my: 2 }}>
                  <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
                  <Box sx={{ mx: 2, color: "text.secondary", fontWeight: 600 }}>
                    o
                  </Box>
                  <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
                </Box>
                {/* Social login buttons. Side by side on a phone: two full
                    rows cost 54px of height that the signed-out screen does
                    not have, and the provider's logo carries the meaning
                    without the words. */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "row", sm: "column" },
                    gap: 1,
                  }}
                >
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={async () => {
                      setSocialLoginPending(true);
                      // Store provider in sessionStorage for tracking
                      sessionStorage.setItem("lastSocialProvider", "google");
                      gaEvent({
                        action: "social_login_attempt",
                        params: {
                          provider: "google",
                          method: "social_signup",
                        },
                      });
                      await signIn("google", {
                        callbackUrl: "/profile-completion",
                      });
                      setSocialLoginPending(false);
                    }}
                    disabled={socialLoginPending}
                    aria-label={
                      socialLoginPending
                        ? "Conectando con Google"
                        : "Conectate con Google"
                    }
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      py: 1.5,
                      borderRadius: 1.5,
                      textTransform: "none",
                      fontSize: 16,
                      fontWeight: 600,
                      borderColor: "text.primary",
                      color: "text.primary",
                      backgroundColor: "#0F172A",
                      "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "action.hover",
                      },
                      "&:disabled": {
                        opacity: 0.6,
                      },
                      flex: { xs: 1, sm: "none" },
                      minWidth: 0,
                    }}
                  >
                    {socialLoginPending ? (
                      <CircularProgress
                        size={20}
                        sx={{ color: "text.primary" }}
                      />
                    ) : (
                      <GoogleIcon sx={{ color: "#4285F4" }} />
                    )}
                    {socialLoginPending ? (
                      "Conectando..."
                    ) : (
                      <>
                        <Box
                          component="span"
                          sx={{ display: { xs: "none", sm: "inline" } }}
                        >
                          Conectate con{" "}
                        </Box>
                        Google
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={async () => {
                      setSocialLoginPending(true);
                      sessionStorage.setItem("lastSocialProvider", "apple");
                      gaEvent({
                        action: "social_login_attempt",
                        params: {
                          provider: "apple",
                          method: "social_signup",
                        },
                      });
                      await signIn("apple", {
                        callbackUrl: "/profile-completion",
                      });
                      setSocialLoginPending(false);
                    }}
                    disabled={socialLoginPending}
                    aria-label={
                      socialLoginPending
                        ? "Conectando con Apple"
                        : "Conectate con Apple"
                    }
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      py: 1.5,
                      borderRadius: 1.5,
                      textTransform: "none",
                      fontSize: 16,
                      fontWeight: 600,
                      borderColor: "text.primary",
                      color: "text.primary",
                      backgroundColor: "#0F172A",
                      "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "action.hover",
                      },
                      "&:disabled": {
                        opacity: 0.6,
                      },
                      flex: { xs: 1, sm: "none" },
                      minWidth: 0,
                    }}
                  >
                    {socialLoginPending ? (
                      <CircularProgress
                        size={20}
                        sx={{ color: "text.primary" }}
                      />
                    ) : (
                      <AppleIcon sx={{ color: "#FFF" }} />
                    )}
                    {socialLoginPending ? (
                      "Conectando..."
                    ) : (
                      <>
                        <Box
                          component="span"
                          sx={{ display: { xs: "none", sm: "inline" } }}
                        >
                          Conectate con{" "}
                        </Box>
                        Apple
                      </>
                    )}
                  </Button>

                  {/* Facebook login temporarily disabled - requires app review
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={async () => {
                      setIsLoading(true);
                      // Store provider in sessionStorage for persistence across redirects
                      sessionStorage.setItem('lastSocialProvider', 'meta');
                      // Track social login attempt
                      gaEvent({
                        action: 'social_login_attempt',
                        params: {
                          provider: 'meta',
                          method: 'social_signup',
                        }
                      });
                      await signIn('facebook', { callbackUrl: '/profile-completion' });
                      setIsLoading(false);
                    }}
                    disabled={isLoading}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      py: 1.5,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontSize: 16,
                      fontWeight: 600,
                      borderColor: 'text.primary',
                      color: 'text.primary',
                      backgroundColor: '#0F172A',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                      '&:disabled': {
                        opacity: 0.6,
                      }
                    }}
                  >
                    <FacebookIcon sx={{ color: '#1877F3' }} />
                    Conectate con Meta
                  </Button>
                  */}
                </Box>
              </>
            )}

            {step === "existing-user" && (
              <ExistingUserStep
                email={email}
                firstName={userFirstName}
                gender={userGender}
                isLoading={isLoading}
                error={error}
                onBack={() => {
                  setStep("email");
                  setPhase("email");
                }}
                onSubmit={async (pw) => {
                  setIsLoading(true);
                  setError("");
                  try {
                    // Call the login API route
                    const res = await fetch("/api/auth/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, password: pw }),
                    });
                    if (!res.ok) {
                      setError("Credenciales inválidas");
                      gaEvent({
                        action: "login_error",
                        params: {
                          method: "password",
                          error: "invalid_credentials",
                          email_provided: !!email,
                        },
                      });
                      setIsLoading(false);
                      return;
                    }
                    const data = await res.json();
                    const nxt = await signIn("credentials", {
                      redirect: false,
                      accessToken: data.access_token,
                      refreshToken: data.refresh_token,
                    });
                    if (nxt?.error) {
                      setError("Credenciales inválidas");
                      gaEvent({
                        action: "login_error",
                        params: {
                          method: "password",
                          error: "invalid_credentials",
                          email_provided: !!email,
                        },
                      });
                    } else {
                      gaEvent({
                        action: "login_success",
                        params: {
                          method: "password",
                        },
                      });
                      onClose();
                    }
                  } catch (err: unknown) {
                    setError(getErrorMessage(err));
                  }
                  setIsLoading(false);
                }}
                onForgotPassword={() => {
                  setForgotPassword(true);
                  setIsLoading(true);
                  fetch("/api/auth/send-code", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ identifier: email }),
                  })
                    .then(() => {
                      setStep("code");
                      setError("");
                    })
                    .catch((err) => {
                      setError(getErrorMessage(err));
                    })
                    .finally(() => setIsLoading(false));
                }}
              />
            )}

            {step === "code" && forgotPassword && (
              <CodeStep
                email={email}
                onChangeEmail={returnToEmail}
                initialCode={code}
                isLoading={isLoading}
                error={error}
                onBack={() => { setError(''); setStep('existing-user'); setForgotPassword(false); }}
                onSubmit={async (c) => {
                  setIsLoading(true); setError('');
                  try {
                    // Validate (without consuming) before asking for the new password
                    const res = await fetch('/api/auth/check-code', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ identifier: email, code: c }),
                    });
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({}));
                      throw new Error(body.message || 'Código inválido o expirado');
                    }
                    setCode(c);
                    setStep('password');
                  } catch (err: unknown) {
                    setError(getErrorMessage(err));
                  }
                  setIsLoading(false);
                }}
              />
            )}

            {step === "code" && !forgotPassword && (
              <CodeStep
                email={email}
                onChangeEmail={returnToEmail}
                initialCode={code}
                isLoading={isLoading}
                error={error}
                onBack={() => {
                  setStep("email");
                  setPhase("email");
                }}
                onSubmit={async (c) => {
                  setIsLoading(true);
                  setError("");
                  setCode(c);
                  try {
                    const res = await fetch("/api/auth/verify-code", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        identifier: email,
                        code: c,
                        deviceId,
                      }),
                    });
                    const body = await res.json();
                    if (!res.ok) throw new Error(body.message || "Error");
                    if (body.isNew) {
                      trackSignupStep("email_verification");
                      setRegistrationToken(body.registration_token);
                      setStep("profile");
                    } else {
                      gaEvent({
                        action: "login_success",
                        params: {
                          method: "otp",
                        },
                      });
                      const nxt = await signIn("credentials", {
                        redirect: false,
                        accessToken: body.access_token,
                        refreshToken: body.refresh_token,
                      });
                      if (!nxt?.error) {
                        onClose();
                      }
                    }
                  } catch (err: unknown) {
                    setError(getErrorMessage(err));
                    gaEvent({
                      action: "login_error",
                      params: {
                        method: "otp",
                        error:
                          err instanceof Error
                            ? err.message
                            : "otp_verification_failed",
                        email_provided: !!email,
                      },
                    });
                  }
                  setIsLoading(false);
                }}
              />
            )}

            {step === "profile" && registrationToken ? (
              <ProfileStep
                initialFirst={firstName}
                initialLast={lastName}
                initialBirthDate={birthDate}
                initialGender={gender}
                isLoading={isLoading}
                error={error}
                onSubmit={async (f, l, b, g) => {
                  setFirstName(f);
                  setLastName(l);
                  setBirthDate(b);
                  setGender(g);
                  setStep("password");
                }}
                onBack={() => {
                  setStep("email");
                  setPhase("email");
                }}
              />
            ) : null}

            {step === 'password' && forgotPassword && (
              <PasswordStep
                isLoading={isLoading}
                error={error}
                submitLabel="Cambiar contraseña"
                onBack={() => { setError(''); setStep('code'); }}
                onSubmit={async (pw) => {
                  setIsLoading(true); setError('');
                  try {
                    // The backend verifies the OTP here (the code step only collects it)
                    const res = await fetch('/api/users/reset-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, code, password: pw }),
                    });
                    const body = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      throw new Error(body.message || 'No se pudo cambiar la contraseña. Revisá el código e intentá de nuevo.');
                    }
                    // Log in with the new password
                    const loginRes = await fetch('/api/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, password: pw }),
                    });
                    if (!loginRes.ok) throw new Error('Contraseña cambiada. Iniciá sesión con tu nueva contraseña.');
                    const data = await loginRes.json();
                    const nxt = await signIn('credentials', {
                      redirect: false,
                      accessToken: data.access_token,
                      refreshToken: data.refresh_token,
                    });
                    if (nxt?.error) throw new Error('Contraseña cambiada. Iniciá sesión con tu nueva contraseña.');
                    gaEvent({ action: 'password_reset_success' });
                    onClose();
                  } catch (err: unknown) {
                    setError(getErrorMessage(err));
                  }
                  setIsLoading(false);
                }}
              />
            )}

            {step === "password" && !forgotPassword && (
              <PasswordStep
                isLoading={isLoading}
                error={error}
                onBack={() => setStep("profile")}
                submitLabel="Registrarme"
                onSubmit={async (pw) => {
                  setIsLoading(true);
                  setError("");
                  try {
                    const res = await fetch("/api/auth/register", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        registration_token: registrationToken,
                        firstName,
                        lastName,
                        password: pw,
                        deviceId,
                        birthDate: birthDate || undefined,
                        gender: mapGenderToBackend(gender),
                      }),
                    });
                    const body = await res.json();
                    if (!res.ok)
                      throw new Error(body.message || "Error registro");
                    const nxt = await signIn("credentials", {
                      redirect: false,
                      accessToken: body.access_token,
                      refreshToken: body.refresh_token,
                    });
                    if (nxt?.error)
                      throw new Error("No se pudo iniciar sesión");

                    // Here is where the sign-up is finished. The wait runs
                    // alongside the call below rather than after it, so the
                    // bar gets its moment without the person waiting twice.
                    setFlowComplete(true);
                    const barFilled = new Promise((r) => setTimeout(r, 420));

                    // The password step is where the terms are accepted, so
                    // record it now — otherwise the consent dialog would greet
                    // this user asking them to accept what they just accepted.
                    // Best effort: if it fails they simply see the dialog once.
                    try {
                      await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/users/me/seen-features`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${body.access_token}`,
                          },
                          body: JSON.stringify({
                            feature: buildLegalConsentEntry(),
                          }),
                        },
                      );
                    } catch {
                      // Non-fatal; the dialog is the fallback.
                    }

                    gaEvent({
                      action: "signup_success",
                      params: {
                        has_first_name: !!firstName,
                        has_last_name: !!lastName,
                        has_birth_date: !!birthDate,
                        has_gender: !!gender,
                      },
                    });
                    await barFilled;
                    onClose();
                  } catch (err: unknown) {
                    setFlowComplete(false);
                    setError(getErrorMessage(err));
                    gaEvent({
                      action: "signup_error",
                      params: {
                        step: "final_registration",
                        error: err instanceof Error ? err.message : "unknown",
                      },
                    });
                  }
                  setIsLoading(false);
                }}
              />
            )}
          </DialogContent>
        </>
      }
    </>
  );

  if (variant === "inline") {
    return (
      <Paper
        elevation={0}
        sx={{
          backgroundColor: "#141C30",
          borderRadius: 2,
          overflow: "hidden",
          pb: 1,
        }}
      >
        {content}
      </Paper>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            backgroundColor: "#0F172A",
            /**
             * MUI tints a raised Paper with white in dark mode, and a dialog
             * sits at elevation 24. The title and the content paint over it
             * with their own colour, so nobody ever wanted that tint here —
             * but the strip between them has no background of its own, and
             * there the 16% showed through as a grey band.
             */
            backgroundImage: "none",
          },
        },
      }}
    >
      {content}
    </Dialog>
  );
}
