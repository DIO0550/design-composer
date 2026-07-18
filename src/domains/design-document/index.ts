import type { Artboard } from "@/domains/artboard";
import type { ComponentSet } from "@/domains/component";
import {
  FormatVersion,
  type FormatVersionCompatibility,
} from "@/domains/format-version";
import { TokenSet } from "@/domains/token";

export type DesignDocument = Readonly<{
  formatVersion: FormatVersion;
  tokens: TokenSet;
  components: ComponentSet;
  artboards: readonly Artboard[];
}>;

export const DesignDocument = {
  create(params: {
    formatVersion?: FormatVersion;
    tokens?: TokenSet;
    components?: ComponentSet;
    artboards?: readonly Artboard[];
  }): DesignDocument {
    return {
      formatVersion: params.formatVersion ?? FormatVersion.CURRENT,
      tokens: params.tokens ?? TokenSet.empty(),
      components: params.components ?? {},
      artboards: params.artboards ?? [],
    };
  },

  compatibility(document: DesignDocument): FormatVersionCompatibility {
    return FormatVersion.compatibility(document.formatVersion);
  },
} as const;
