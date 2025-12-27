"use client";

import { Select } from "@base-ui/react/select";
import { Checkmark1Icon, ChevronDownSmallIcon } from "@/icons";
import styles from "./styles.module.css";

const items = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Carrot", value: "carrot" },
];

export function StraightAheadActionAndPoseToPose() {
  return (
    <div className={styles.container}>
      <div className={styles.select} data-caption="Straight Ahead">
        <Select.Root items={items} defaultValue={items[0].value}>
          <Select.Trigger className={styles.trigger} style={{ width: 120 }}>
            <Select.Value className={styles.value} />
            <Select.Icon>
              <ChevronDownSmallIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner
              className={styles.positioner}
              alignItemWithTrigger={false}
              sideOffset={8}
            >
              <Select.ScrollUpArrow />
              <Select.Popup className={styles.popup}>
                {items.map((item) => (
                  <Select.Item
                    key={item.value}
                    value={item.value}
                    className={styles.item}
                  >
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Checkmark1Icon />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Popup>
              <Select.ScrollDownArrow />
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>
      <svg
        viewBox="0 0 4 200"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.divider}
      >
        <title>Divider</title>
        <line
          x1="2"
          y1="2"
          x2="2"
          y2="200"
          stroke="var(--gray-4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 4"
        />
      </svg>
      <div className={styles.select} data-caption="Pose to Pose">
        <Select.Root items={items} defaultValue={items[0].value}>
          <Select.Trigger className={styles.trigger} style={{ width: 120 }}>
            <Select.Value className={styles.value} />
            <Select.Icon>
              <ChevronDownSmallIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner
              className={styles.positioner}
              alignItemWithTrigger={false}
              sideOffset={8}
            >
              <Select.ScrollUpArrow />
              <Select.Popup
                className={styles.popup}
                data-animation="pose-to-pose"
              >
                {items.map((item) => (
                  <Select.Item
                    key={item.value}
                    value={item.value}
                    className={styles.item}
                  >
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Checkmark1Icon />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Popup>
              <Select.ScrollDownArrow />
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>
      <svg
        viewBox="0 0 4 200"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.divider}
      >
        <title>Divider</title>
        <line
          x1="2"
          y1="2"
          x2="2"
          y2="200"
          stroke="var(--gray-4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 4"
        />
      </svg>
      <div className={styles.select} data-caption="Blending Both">
        <Select.Root items={items} defaultValue={items[0].value}>
          <Select.Trigger className={styles.trigger} style={{ width: 120 }}>
            <Select.Value className={styles.value} />
            <Select.Icon>
              <ChevronDownSmallIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner
              className={styles.positioner}
              alignItemWithTrigger={false}
              sideOffset={8}
            >
              <Select.ScrollUpArrow />
              <Select.Popup className={styles.popup} data-animation="blend">
                {items.map((item) => (
                  <Select.Item
                    key={item.value}
                    value={item.value}
                    className={styles.item}
                  >
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Checkmark1Icon />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Popup>
              <Select.ScrollDownArrow />
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>
    </div>
  );
}
