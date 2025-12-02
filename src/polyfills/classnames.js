// ESM wrapper for classnames (CommonJS compatibility)
// This fixes: "does not provide an export named 'default'"

const SPACE = ' ';

function classNames(...args) {
  const classes = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    const argType = typeof arg;

    if (argType === 'string' || argType === 'number') {
      classes.push(arg);
    } else if (Array.isArray(arg)) {
      if (arg.length) {
        const inner = classNames(...arg);
        if (inner) {
          classes.push(inner);
        }
      }
    } else if (argType === 'object') {
      if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes('[native code]')) {
        classes.push(arg.toString());
      } else {
        for (const key in arg) {
          if (Object.prototype.hasOwnProperty.call(arg, key) && arg[key]) {
            classes.push(key);
          }
        }
      }
    }
  }

  return classes.join(SPACE);
}

// Bind for alternative call style
classNames.bind = classNames;
classNames.default = classNames;

// Named export
export { classNames };

// Default export
export default classNames;
