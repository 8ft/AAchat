module.exports = function formatReg(reg) {
    if (!reg) return ''
		reg = reg.replace(/\\/g, '\\\\')
    reg = reg.replace(/\$/g, '\\$')
    reg = reg.replace(/\(/g, '\\(')
    reg = reg.replace(/\)/g, '\\)')
    reg = reg.replace(/\*/g, '\\*')
    reg = reg.replace(/\+/g, '\\+')
    reg = reg.replace(/\./g, '\\.')
    reg = reg.replace(/\[/g, '\\[')
    reg = reg.replace(/\]/g, '\\]')
    reg = reg.replace(/\?/g, '\\?')
    reg = reg.replace(/\^/g, '\\^')
    reg = reg.replace(/\{/g, '\\{')
    reg = reg.replace(/\}/g, '\\}')
    reg = reg.replace(/\|/g, '\\|')
    return reg
}
