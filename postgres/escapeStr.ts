function escapeStr(str: string): string {
  return `'${String(str).replace(/(['])/gi, '$1$1')}'`
}

export default escapeStr
