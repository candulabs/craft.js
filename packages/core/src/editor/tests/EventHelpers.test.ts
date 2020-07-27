import { EventHelpers } from '../EventHelpers';
import {
  card,
  documentWithVariousNodes,
  primaryButton,
  rootNode,
  secondaryButton,
} from '../../tests/fixtures';
import { serializeNode } from '../../utils/serializeNode';

let helper;

const selectedNodeIds = ['node-a', 'node-b', 'node-c'];

const state = {
  events: {
    selected: new Set(selectedNodeIds),
    hovered: new Set(),
  },
};

describe('EventHelpers', () => {
  beforeEach(() => {
    helper = (eventType) => EventHelpers(state as any, eventType);
  });

  describe('isEmpty', () => {
    it('should return true if event is empty', () => {
      expect(helper('hovered').isEmpty()).toBe(true);
    });
    it('should return false if event is not empty', () => {
      expect(helper('selected').isEmpty()).toBe(false);
    });
  });

  describe('all', () => {
    it('should return all nodes in event', () => {
      expect(helper('selected').all()).toStrictEqual(selectedNodeIds);
    });
  });

  describe('first', () => {
    it('should return first node', () => {
      expect(helper('selected').first()).toBe('node-a');
    });
  });

  describe('last', () => {
    it('should return last node', () => {
      expect(helper('selected').last()).toBe('node-c');
    });
  });

  describe('contains', () => {
    it('should return true if node is in event', () => {
      expect(helper('selected').contains('node-b')).toBe(true);
    });
    it('should return false if node is in not in event', () => {
      expect(helper('selected').contains('node-d')).toBe(false);
    });
  });

  describe('raw', () => {
    it('should return the raw event state', () => {
      expect(helper('selected').raw()).toBe(state.events['selected']);
    });
  });
});
