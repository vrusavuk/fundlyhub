import { ComponentPropsWithRef, ElementType } from 'react';

/**
 * Polymorphic component types for "as" prop support
 * Enables full TypeScript autocomplete for all HTML attributes
 */

export type PolymorphicRef<C extends ElementType> = ComponentPropsWithRef<C>['ref'];

type AsProp<C extends ElementType> = {
  as?: C;
};

export type PolymorphicComponentPropWithRef<
  C extends ElementType,
  Props = {}
> = AsProp<C> & Props & Omit<ComponentPropsWithRef<C>, keyof (AsProp<C> & Props)>;
