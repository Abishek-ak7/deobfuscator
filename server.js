const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Set timeout for all requests
app.use((req, res, next) => {
  req.setTimeout(5000); // 2 minutes
  next();
});

class JavaScriptDeobfuscator {
  constructor() {
    this.variableCounter = 0;
    this.functionCounter = 0;
    this.numericCounter = 0;
    this.mappings = new Map();
    this.numericMappings = new Map();
    this.usedNames = new Set();

    this.reservedWords = new Set([
      'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
      'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
      'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super',
      'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield'
    ]);

    this.protectedIdentifiers = new Set([
      'document', 'window', 'navigator', 'location', 'console',
      'getElementById', 'querySelector', 'querySelectorAll',
      'createElement', 'appendChild', 'removeChild', 'innerHTML',
      'addEventListener', 'removeEventListener', 'setTimeout', 'setInterval',' setClipboardCopyData',
      'clearTimeout', 'clearInterval', 'localStorage', 'sessionStorage',
      'fetch', 'XMLHttpRequest', 'File', 'Blob', 'download', 'URL', 'createObjectURL','DownloadFile','WebClient','charCodeAt','fromCharCode',
    ]);

    this.commonNumbers = new Set([
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
      '100', '200', '300', '400', '401', '403', '404', '500', '503',
      '24', '60', '365', '1000', '3600', '86400',
      '16', '32', '64', '128', '256', '512', '1024', '2048', '4096'
    ]);

    this.meaningfulNames = {
      variables: ['element', 'container', 'wrapper', 'content', 'data', 'result', 'value', 'item',
        'config', 'options', 'settings', 'params', 'args', 'response', 'request',
        'target', 'source', 'destination', 'handler', 'callback', 'listener',
        'counter', 'index', 'length', 'size', 'count', 'total', 'sum',
        'message', 'text', 'string', 'buffer', 'cache', 'storage', 'memory',
        'timer', 'interval', 'timeout', 'delay', 'duration', 'timestamp',
        'url', 'path', 'route', 'endpoint', 'api', 'service', 'client',
        'user', 'session', 'token', 'key', 'id', 'name', 'title', 'description'
      ],
      functions: ['initialize', 'setup', 'configure', 'process', 'execute', 'run', 'start',
        'stop', 'pause', 'resume', 'update', 'refresh', 'reload', 'reset',
        'create', 'build', 'generate', 'construct', 'make', 'produce',
        'parse', 'format', 'convert', 'transform', 'encode', 'decode',
        'validate', 'verify', 'check', 'test', 'confirm', 'ensure',
        'get', 'set', 'add', 'remove', 'delete', 'insert', 'append',
        'find', 'search', 'filter', 'sort', 'map', 'reduce', 'forEach',
        'handle', 'manage', 'control', 'monitor', 'track', 'observe',
        'send', 'receive', 'fetch', 'load', 'save', 'store', 'retrieve',
        'show', 'hide', 'display', 'render', 'draw', 'paint', 'animate'
      ]
    };
  }

  //It will generate the names for the hexadecimal names in the dunciton
  generateAlphabeticName() {
    let result = '';
    let num = this.numericCounter;
    do {
      result = String.fromCharCode(97 + (num % 26)) + result;
      num = Math.floor(num / 26);
    } while (num > 0);
    this.numericCounter++;
    return result;
  }

  //It will be used to create the meaning full names from the list 
  generateMeaningfulName(type) {
    const nameList = this.meaningfulNames[type] || this.meaningfulNames.variables;
    let name;
    do {
      const baseName = nameList[
        type === 'functions' ? this.functionCounter % nameList.length : this.variableCounter % nameList.length
      ];
      const suffix = Math.floor(
        (type === 'functions' ? this.functionCounter : this.variableCounter) / nameList.length
      );
      name = suffix === 0 ? baseName : `${baseName}${suffix + 1}`;
      if (type === 'functions') this.functionCounter++;
      else this.variableCounter++;
    } while (this.usedNames.has(name));
    this.usedNames.add(name);
    return name;
  }
  
//It will check whether the identified is obfuscated or not using the patterns
  isObfuscatedIdentifier(name) {
    if (name.length <= 2 && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) return true;
    if (/^[_$][0-9a-fA-F]+$/.test(name) || /^_0x[0-9a-fA-F]+/.test(name)) return true;
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) && name.length > 2) {
      const hasRandomPattern = /[a-z][A-Z]|[A-Z][a-z]/.test(name) &&
        !/^[A-Z][a-z]+$/.test(name) &&
        !/^[a-z]+[A-Z][a-z]*$/.test(name);
      return hasRandomPattern;
    }
    return false;
  }

  //It will be used to check the number is either obfuscated if it then it will replace it with the alternative
  isObfuscatedNumber(value) {
    

  let num;
  if (/^[-+]?0x[0-9a-fA-F]+$/.test(value)) {
    num = parseInt(value, 16) * (value.startsWith('-') ? -1 : 1);
  } else {
    num = parseInt(value);
  }
    if (isNaN(num)) return false;
    if (this.commonNumbers.has(value)) return false;
    if (num >= 32 && num <= 126) return true;
    if (num.toString(16).length >= 2 && /^[0-9a-fA-F]+$/.test(num.toString(16))) return true;
    if (num > 1000 && num < 1000000) return true;
    if (/^[0-9]{4,}$/.test(value)) return true;
    if (num > 99 && num < 1000 && num % 10 !== 0) return true;
    if ((num >= 65 && num <= 90) || (num >= 97 && num <= 122) || (num >= 48 && num <= 57)) return true;
    return false;
  }

  //It will be used to extract the obfuscated characters from the function
  extractObfuscatedIdentifiers(code) {
    const identifiers = new Set();
    const numbers = new Set();
    const allIdentifiers = code.match(/\b_0x[a-fA-F0-9]{4,}\b/g);
    if (allIdentifiers) {
    allIdentifiers.forEach(name => {
    if (!this.reservedWords.has(name) && !this.protectedIdentifiers.has(name)) {
      identifiers.add(name);
    }
  });
}

    const varMatches = code.match(/(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
    if (varMatches) {
      varMatches.forEach(match => {
        const name = match.replace(/(?:var|let|const)\s+/, '');
        if (this.isObfuscatedIdentifier(name)) identifiers.add(name);
      });
    }
    const funcMatches = code.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
    if (funcMatches) {
      funcMatches.forEach(match => {
        const name = match.replace(/function\s+/, '');
        if (this.isObfuscatedIdentifier(name)) identifiers.add(name);
      });
    }
    const funcExprMatches = code.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function/g);
    if (funcExprMatches) {
      funcExprMatches.forEach(match => {
        const name = match.replace(/\s*=\s*function/, '');
        if (this.isObfuscatedIdentifier(name)) identifiers.add(name);
      });
    }
    const propMatches = code.match(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
    if (propMatches) {
      propMatches.forEach(match => {
        const name = match.substring(1);
        if (this.isObfuscatedIdentifier(name) && !this.reservedWords.has(name)) identifiers.add(name);
      });
    }

const numberMatches = code.match(/(?:[-+])?0x[a-fA-F0-9]+|\b\d+\b/g);
    if (numberMatches) {
      numberMatches.forEach(match => {
        if (this.isObfuscatedNumber(match)) numbers.add(match);
      });
    }
    return {
      identifiers: Array.from(identifiers),
      numbers: Array.from(numbers)
    };
  }

  //It will be called once the obfuscation is completed it will be used to check for the remaining obfuscated words in the list.
  deobfuscate(code) {
    try {
      let deobfuscatedCode = code;
      const extracted = this.extractObfuscatedIdentifiers(code);
      const obfuscatedIdentifiers = extracted.identifiers;
      const obfuscatedNumbers = extracted.numbers;

      obfuscatedIdentifiers.forEach(identifier => {
        if (!this.mappings.has(identifier) && !this.protectedIdentifiers.has(identifier)) {
          const isFunctionPattern = new RegExp(`\\b${identifier}\\s*\\(|function\\s+${identifier}\\b`).test(code);
          const type = isFunctionPattern ? 'functions' : 'variables';
          const newName = this.generateMeaningfulName(type);
          this.mappings.set(identifier, newName);
        }
      });
      // After deobfuscation and replacements
const powershellCommands = [];

// Step 1: Normalize escape sequences and HTML entities
const normalizedCode = deobfuscatedCode
  .replace(/&gt;/g, '>')
  .replace(/&lt;/g, '<')
  .replace(/&amp;/g, '&')
  .replace(/\\\//g, '/')
  .replace(/\\"/g, '"')
  .replace(/\\'/g, "'")
  .replace(/\\\\/g, '\\');

const psCommandRegex = /[`'"]?(powershell\s+[^`"'(){};]*?-[^\n]*?)(["'`])([\s\S]*?)\2/gim;

let match;
while ((match = psCommandRegex.exec(normalizedCode)) !== null) {
  const fullCommand = `${match[1]}${match[2]}${match[3]}${match[2]}`;
  powershellCommands.push(fullCommand.trim());
}



      obfuscatedIdentifiers.forEach(identifier => {
    if (!this.mappings.has(identifier) && !this.protectedIdentifiers.has(identifier)) {
    const isFunctionPattern = new RegExp(`\\b${identifier}\\s*\\(|function\\s+${identifier}\\b`).test(code);
    const type = isFunctionPattern ? 'functions' : 'variables';
    const newName = this.generateMeaningfulName(type);
    this.mappings.set(identifier, newName);
  }
});


      obfuscatedNumbers.forEach(number => {
 let replacement;
if (this.decodeNumbersAsChars) {
  let num;
  if (/^[-+]?0x[0-9a-fA-F]+$/.test(number)) {
    num = parseInt(number, 16);
  } else {
    num = parseInt(number);
  }
  replacement = (num >= 32 && num <= 126) ? `'${String.fromCharCode(num)}'` : num.toString();
} else {
  replacement = this.generateAlphabeticName();
}
this.numericMappings.set(number, replacement);

      });

      this.mappings.forEach((newName, oldName) => {
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        deobfuscatedCode = deobfuscatedCode.replace(regex, newName);
      });

      this.numericMappings.forEach((alphabeticName, number) => {
        
const escaped = number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'g');
        deobfuscatedCode = deobfuscatedCode.replace(regex, alphabeticName);
      });

      

      return {
        success: true,
        deobfuscated: deobfuscatedCode,
        mappings: Object.fromEntries(this.mappings),
        numericMappings: Object.fromEntries(this.numericMappings),
        powershellCommands
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

//It will be used in the timeout checking
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Script execution timed out')), ms)
  );
  return Promise.race([promise, timeout]);
}


//An API which will be used in the deobfuscation proces.
app.post('/deobfuscate', async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'No valid code provided' });
  }
  try {
    const deobfuscator = new JavaScriptDeobfuscator();
    const result = await withTimeout(
      Promise.resolve(deobfuscator.deobfuscate(code)),
      30000
    );
    console.log(result)
    res.json(result);
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('🛡️ JavaScript Deobfuscator API is running');
});

//It will be used to check the status of the server
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Enhanced JavaScript Deobfuscator is running' });
});

//It will indicate the execution of the server in the port number.
app.listen(3000, () => {
  console.log('Enhanced JavaScript Deobfuscator running on http://localhost:3000');
});
