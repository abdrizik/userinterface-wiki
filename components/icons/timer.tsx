import type { IconProps } from "./types";

export const TimerIcon = ({
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
      <title>Timer</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1C8.44772 1 8 1.44772 8 2C8 2.55228 8.44772 3 9 3H11V4.06189C6.05369 4.55399 2 7.92038 2 12C2 16.4183 5.58172 20 10 20H14C18.4183 20 22 16.4183 22 12C22 7.92038 17.9463 4.55399 13 4.06189V3H15C15.5523 3 16 2.55228 16 2C16 1.44772 15.5523 1 15 1H9ZM12 6C7.58172 6 4 8.68629 4 12C4 15.3137 7.58172 18 12 18C16.4183 18 20 15.3137 20 12C20 8.68629 16.4183 6 12 6ZM12 8C12.5523 8 13 8.44772 13 9V11.5858L14.7071 13.2929C15.0976 13.6834 15.0976 14.3166 14.7071 14.7071C14.3166 15.0976 13.6834 15.0976 13.2929 14.7071L11.2929 12.7071C11.1054 12.5196 11 12.2652 11 12V9C11 8.44772 11.4477 8 12 8Z"
        fill={color}
      />
    </svg>
  );
};
