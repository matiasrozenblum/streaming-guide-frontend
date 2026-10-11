import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Alert,
  AlertTitle,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MenuItem from "@mui/material/MenuItem";
import { useSession } from "next-auth/react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  birthDateError as validateBirthDate,
  MINIMUM_AGE_YEARS,
} from "@/utils/age";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

interface ProfileStepProps {
  initialFirst?: string;
  initialLast?: string;
  initialBirthDate?: string;
  initialGender?: string;
  onSubmit: (
    first: string,
    last: string,
    birthDate: string,
    gender: string,
  ) => void;
  onBack: () => void;
  error?: string;
  isLoading?: boolean;
  showBackButton?: boolean;
}

export default function ProfileStep({
  initialFirst = "",
  initialLast = "",
  initialBirthDate = "",
  initialGender = "",
  error,
  onSubmit,
  onBack,
  isLoading = false,
  showBackButton = true,
}: ProfileStepProps) {
  const { data: session } = useSession();
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);
  // Empty, not today: an untouched field defaulting to today submitted an
  // age of zero, which the server now rejects.
  const [birthDate, setBirthDate] = useState<Dayjs | null>(
    initialBirthDate ? dayjs(initialBirthDate) : null,
  );
  const [gender, setGender] = useState(initialGender);
  const [localErr, setLocalErr] = useState("");
  // If user is from social provider, disable name fields if present
  const isSocial =
    !!session?.user &&
    (session.user.firstName || session.user.lastName || session.user.email);
  const [birthDateError, setBirthDateError] = useState("");

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!first.trim()) {
      setLocalErr("Ingresa tu nombre");
      return;
    }
    if (!last.trim()) {
      setLocalErr("Ingresa tu apellido");
      return;
    }
    if (!gender) {
      setLocalErr("Selecciona tu género");
      return;
    }
    const ageError = validateBirthDate(birthDate);
    if (ageError) {
      setBirthDateError(ageError);
      setLocalErr(ageError);
      return;
    }
    setLocalErr("");
    const birthDateString = birthDate ? birthDate.format("YYYY-MM-DD") : "";
    onSubmit(first.trim(), last.trim(), birthDateString, gender);
  };

  const handleBirthDateChange = (value: Dayjs | null) => {
    setBirthDate(value);
    setBirthDateError(validateBirthDate(value) ?? "");
  };

  return (
    <Box
      component="form"
      onSubmit={handle}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <TextField
        label="Nombre"
        fullWidth
        value={first}
        onChange={(e) => setFirst(e.target.value)}
        autoFocus
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonOutlineIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        disabled={Boolean(isSocial && first)}
      />
      <TextField
        label="Apellido"
        fullWidth
        value={last}
        onChange={(e) => setLast(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonOutlineIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        disabled={Boolean(isSocial && last)}
      />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <Box sx={{ display: "flex", gap: 2 }}>
          <DatePicker
            label="Fecha de nacimiento"
            value={birthDate}
            onChange={handleBirthDateChange}
            // Nobody eligible was born this year.
            maxDate={dayjs().subtract(MINIMUM_AGE_YEARS, "year")}
            format="DD/MM/YYYY"
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!birthDateError,
                helperText: birthDateError,
                placeholder: dayjs().format("DD/MM/YYYY"),
                InputLabelProps: {
                  shrink: true,
                },
              },
            }}
          />
          <TextField
            label="Género"
            select
            fullWidth
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <MenuItem value="masculino">Masculino</MenuItem>
            <MenuItem value="femenino">Femenino</MenuItem>
            <MenuItem value="no_binario">No binario</MenuItem>
            <MenuItem value="prefiero_no_decir">Prefiero no decir</MenuItem>
          </TextField>
        </Box>
      </LocalizationProvider>
      {(localErr || error) && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {localErr || error}
        </Alert>
      )}
      <Box sx={{ display: "flex", gap: 1 }}>
        {showBackButton && (
          <Button
            variant="outlined"
            startIcon={<ArrowBackIosNewIcon fontSize="small" />}
            fullWidth
            onClick={onBack}
            aria-label="Volver al paso anterior"
          >
            Volver
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={
            !first ||
            !last ||
            !birthDate ||
            !gender ||
            !!birthDateError ||
            isLoading
          }
          aria-label={isLoading ? "Guardando perfil" : undefined}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Continuar"
          )}
        </Button>
      </Box>
    </Box>
  );
}
