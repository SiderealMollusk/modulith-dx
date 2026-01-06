declare const brand: unique symbol;

export type Brand<T, B> = T & { readonly [brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type OrderId = Brand<string, 'OrderId'>;
export type ProductId = Brand<string, 'ProductId'>;
