export const APPEND_REPORT=`
redis.call('LPUSH',KEYS[1],ARGV[1])
redis.call('LTRIM',KEYS[1],0,199)
return 1
`;
export const UPDATE_REPORT=`
local rows=redis.call('LRANGE',KEYS[1],0,199)
for i,raw in ipairs(rows) do
  local ok,row=pcall(cjson.decode,raw)
  if ok and type(row)=='table' and row.id==ARGV[1] then
    row.status=ARGV[2]
    if ARGV[2]=='resolved' then row.resolvedAt=ARGV[3] else row.resolvedAt=nil end
    local encoded=cjson.encode(row)
    redis.call('LSET',KEYS[1],i-1,encoded)
    return encoded
  end
end
return false
`;
