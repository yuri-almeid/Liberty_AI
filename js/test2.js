


function epochToJsDate(ts){
  // ts = epoch timestamp
  // returns date obj
  return new Date(ts*1000);
}


console.log(epochToJsDate(1594329586));
