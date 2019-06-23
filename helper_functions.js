module.exports = {
    keywordCheck: function (sText) {
        sText = sText.toLowerCase();
        return sText.includes("checklist") && (sText.includes("yes") || sText.includes("no"));      
    }
};  