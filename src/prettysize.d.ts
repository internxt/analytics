declare module 'prettysize' {
  export default function prettySize(
    bytes: number,
    nospace?: boolean,
    one?: boolean,
    places?: number,
    numOnly?: boolean,
  ): string;
}
