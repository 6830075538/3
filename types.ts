/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProjectStatus = 'Draft' | 'Final';

export interface PlotLine {
  id: string;
  title: string;
  color: string;
}

export interface Timepoint {
  id: string;
  title: string;
  date?: string; // ISO format or just YYYY-MM-DD
}

export interface PlotCard {
  id: string;
  title: string;
  summary: string;
  status: ProjectStatus;
  plotLineId: string;
  timepointId: string;
  date?: string; 
  involvedCharacterIds?: string[];
}

export interface CharacterAttribute {
  label: string;
  value: string;
}

export type BlockType = 'Short Text' | 'Long Text' | 'Rating Bar' | 'Image' | 'Entity Linker' | 'Color Picker';

export interface TemplateBlock {
  id: string;
  label: string;
  type: BlockType;
  value?: any;
}

export interface Template {
  id: string;
  name: string;
  target: 'Characters' | 'World';
  blocks: TemplateBlock[];
}

export interface Relationship {
  id: string;
  targetId: string;
  targetType: 'Character' | 'World';
  type: string;
  isMutual?: boolean;
}

export type CharacterPlaceholderType = 'Man' | 'Woman' | 'Kid' | 'Elderly' | 'Neutral' | 'Warrior' | 'Mage' | 'Rogue' | 'Noble' | 'Villain';

export type GenderType = 'Male' | 'Female' | 'Non-binary' | 'Gender-Fluid' | 'Non-label';

export interface Character {
  id: string;
  name: string;
  role: string;
  gender?: GenderType;
  image?: string;
  placeholderType?: CharacterPlaceholderType;
  age?: string;
  archetype?: string;
  bio?: string;
  templateId?: string;
  data: TemplateBlock[];
  relationships?: Relationship[];
}

export interface WorldEntity {
  id: string;
  name: string;
  category: string;
  templateId?: string;
  data: TemplateBlock[];
}

export interface Project {
  id: string;
  name: string;
  elevatorPitch: string;
  plotLines: PlotLine[];
  timepoints: Timepoint[];
  plotCards: PlotCard[];
  characters: Character[];
  worldEntities: WorldEntity[];
  templates: Template[];
  lastModified: number;
}

export type TabType = 'Plot' | 'Characters' | 'World' | 'Cloud';
