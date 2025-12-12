"use client";

import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { DecoratorNode } from "lexical";
import styles from "../styles.module.css";

export interface SerializedChipNode
  extends Spread<
    {
      chipKey: string;
      chipValue: string;
      negated: boolean;
    },
    SerializedLexicalNode
  > {}

export class ChipNode extends DecoratorNode<React.ReactNode> {
  __chipKey: string;
  __chipValue: string;
  __negated: boolean;

  static getType(): string {
    return "chip";
  }

  static clone(node: ChipNode): ChipNode {
    return new ChipNode(
      node.__chipKey,
      node.__chipValue,
      node.__negated,
      node.__key
    );
  }

  constructor(
    chipKey: string,
    chipValue: string,
    negated: boolean,
    key?: NodeKey
  ) {
    super(key);
    this.__chipKey = chipKey;
    this.__chipValue = chipValue;
    this.__negated = negated;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "inline";
    return span;
  }

  updateDOM(): false {
    return false;
  }

  isInline(): boolean {
    return true;
  }

  isIsolated(): boolean {
    return false;
  }

  getChipKey(): string {
    return this.__chipKey;
  }

  getChipValue(): string {
    return this.__chipValue;
  }

  isNegated(): boolean {
    return this.__negated;
  }

  getRawText(): string {
    const prefix = this.__negated ? "-" : "";
    return `${prefix}${this.__chipKey}:${this.__chipValue}`;
  }

  decorate(): React.ReactNode {
    return (
      <span className={`${styles.chip} ${this.__negated ? styles.negated : ""}`}>
        {this.__negated && <span className={styles.chipnegated}>−</span>}
        <span className={styles.chiptype}>{this.__chipKey}:</span>
        <span>{this.__chipValue}</span>
      </span>
    );
  }

  static importJSON(serializedNode: SerializedChipNode): ChipNode {
    return $createChipNode(
      serializedNode.chipKey,
      serializedNode.chipValue,
      serializedNode.negated
    );
  }

  exportJSON(): SerializedChipNode {
    return {
      type: "chip",
      version: 1,
      chipKey: this.__chipKey,
      chipValue: this.__chipValue,
      negated: this.__negated,
    };
  }
}

export function $createChipNode(
  key: string,
  value: string,
  negated: boolean
): ChipNode {
  return new ChipNode(key, value, negated);
}

export function $isChipNode(node: LexicalNode | null | undefined): node is ChipNode {
  return node instanceof ChipNode;
}
