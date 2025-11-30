import type { IconProps } from "./types";

export const PlayIcon = ({
  size = 24,
  color = "currentColor",
  ...props
}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      {...props}
    >
      <title>Play</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.5 4.56068C6.5 3.46803 7.67462 2.80425 8.59542 3.36647L19.0038 9.8058C19.8598 10.3309 19.8598 11.6691 19.0038 12.1942L8.59542 18.6335C7.67461 19.1958 6.5 18.532 6.5 17.4393V4.56068Z"
        fill={color}
      />
    </svg>
  );
};
