import PropTypes from "prop-types";
import { useState } from "react";

function EyeIcon({ closed }) {
  if (closed) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3l18 18M10.58 10.58a2 2 0 102.83 2.83M9.88 4.24A10.94 10.94 0 0112 4c5 0 9.27 3.11 11 7.5a11.8 11.8 0 01-4.17 5.94M6.1 6.1A11.77 11.77 0 001 11.5C2.73 15.89 7 19 12 19a10.9 10.9 0 004.24-.82"
        />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7s-8.27-2.94-9.54-7z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

EyeIcon.propTypes = {
  closed: PropTypes.bool.isRequired,
};

function PasswordField({
  value,
  onChange,
  placeholder = "Password",
  className = "",
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
        disabled={disabled}
      >
        <EyeIcon closed={showPassword} />
      </button>
    </div>
  );
}

PasswordField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default PasswordField;
