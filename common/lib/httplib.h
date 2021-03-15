
/*---------------------------------------------------------------------------*/
/* httpparser.h                                                              */
/* copyright (c) innovaphone 2015                                            */
/*                                                                           */
/*---------------------------------------------------------------------------*/

#define CLRF                 "\r\n"

#define HTTP_GET_KEY         "GET"       
#define HTTP_HEAD_KEY        "HEAD"      
#define HTTP_POST_KEY        "POST"      
#define HTTP_PUT_KEY         "PUT"       
#define HTTP_CONNECT_KEY     "CONNECT"   
#define HTTP_OPTIONS_KEY     "OPTIONS"   
#define HTTP_TRACE_KEY       "TRACE"     
#define HTTP_PROPFIND_KEY    "PROPFIND"
#define HTTP_MKCOL_KEY       "MKCOL"
#define HTTP_COPY_KEY        "COPY"
#define HTTP_MOVE_KEY        "MOVE"
#define HTTP_DELETE_KEY      "DELETE"
#define HTTP_LOCK_KEY        "LOCK"
#define HTTP_UNLOCK_KEY      "UNLOCK"
#define HTTP_PROPPATCH_KEY   "PROPPATCH"
#define HTTP_SYSCLIENT_KEY   "SYSCLIENT"

#define HTTP_VERSION_1_0    0x0100
#define HTTP_VERSION_1_1    0x0101

class HTTPLib {
public:
    // HTTP Request Methods
    typedef enum {
        HTTP_NONE,                  // (NO HTTP VALUE!!!) Dummy value to initialize variable
        HTTP_GET,                   // Transfer a current representation of the target resource.
        HTTP_HEAD,                  // Same as GET, but only transfer the status line and header section.
        HTTP_POST,                  // Perform resource - specific processing on the request payload.
        HTTP_PUT,                   // (WebDAV) Replace all current representations of the target resource with the request payload.
        HTTP_CONNECT,               // Establish a tunnel to the server identified by the target resource.
        HTTP_OPTIONS,               // (WebDAV) Describe the communication options for the target resource.
        HTTP_TRACE,                 // (WebDAV) Perform a message loop - back test along the path to the target resource.
        HTTP_PROPFIND,              // (WebDAV) Used to revceive properties for the given resource.
        HTTP_MKCOL,                 // (WebDAV) Creates a new collection at the specified location.
        HTTP_COPY,                  // (WebDAV) Copy the given resource to a specificed location.
        HTTP_MOVE,                  // (WebDAV) Moves the given resource to a specified location.
        HTTP_DELETE,                // (WebDAV) Deletes the given resource.
        HTTP_LOCK,                  // (WebDAV) Locks the given resource.
        HTTP_UNLOCK,                // (WebDAV) Unlocks the previously locked resource
        HTTP_PROPPATCH,             // (WebDAV) Patches the properties of the given resource
        HTTP_SYSCLIENT              // Sysclient request to authenticate localsocket requests
    } http_request_method_t;


    static inline const char * GetHTTPRequestMethodName(http_request_method_t method)
    {
        switch (method)
        {
        case HTTP_GET: return HTTP_GET_KEY; break;
        case HTTP_HEAD: return HTTP_HEAD_KEY; break;
        case HTTP_POST: return HTTP_POST_KEY; break;
        case HTTP_PUT: return HTTP_PUT_KEY; break;
        case HTTP_CONNECT: return HTTP_CONNECT_KEY; break;
        case HTTP_OPTIONS: return HTTP_OPTIONS_KEY; break;
        case HTTP_TRACE: return HTTP_TRACE_KEY; break;
        case HTTP_PROPFIND: return HTTP_PROPFIND_KEY; break;
        case HTTP_MKCOL: return HTTP_MKCOL_KEY; break;
        case HTTP_COPY: return HTTP_COPY_KEY; break;
        case HTTP_MOVE: return HTTP_MOVE_KEY; break;
        case HTTP_DELETE: return HTTP_DELETE_KEY; break;
        case HTTP_LOCK: return HTTP_LOCK_KEY; break;
        case HTTP_UNLOCK: return HTTP_UNLOCK_KEY; break;
        case HTTP_PROPPATCH: return HTTP_PROPPATCH_KEY; break;
        case HTTP_SYSCLIENT: return HTTP_SYSCLIENT_KEY; break;
        default: return "NONE"; break;
        }
    }


    typedef enum {
        HTTP_CONNECTION_NONE = 0x00,
        HTTP_CONNECTION_KEEP_ALIVE = 0x01,
        HTTP_CONNECTION_CLOSE = 0x02,
        HTTP_CONNECTION_UPGRADE = 0x04
    } http_connection_t;


    typedef enum {
        HTTP_UPGRADE_NONE,      // Default
        HTTP_UPGRADE_WEBSOCKET
    } http_upgrade_t;


    typedef enum {
        HTTP_ENCODING_NONE,      // Default
        HTTP_ENCODING_GZIP
    } http_encoding_t;


    typedef struct {
        int code;
        const char * description;
        size_t descLen;
    } http_result_t;


    // HTTP Result Codes. See RFC 7231, Page 41 (https://tools.ietf.org/html/rfc7231#page-49)
    // 1xx - Information
    static const http_result_t HTTP_100; // Continue
    static const http_result_t HTTP_101; // Switching Protocols
    static const http_result_t HTTP_102; // Processing
    static const http_result_t HTTP_103; // Early Hints
    
    // 2xx - Successful operations
    static const http_result_t HTTP_200; // OK
    static const http_result_t HTTP_201; // Created
    static const http_result_t HTTP_202; // Accepted
    static const http_result_t HTTP_203; // Non-Authoritative Information
    static const http_result_t HTTP_204; // No Content
    static const http_result_t HTTP_205; // Reset Content
    static const http_result_t HTTP_206; // Partial Content
    static const http_result_t HTTP_207; // Multi-Status
    static const http_result_t HTTP_208; // Already Reported
    static const http_result_t HTTP_226; // IM Used

    // 3xx - Redirection
    static const http_result_t HTTP_300; // Multiple Choices
    static const http_result_t HTTP_301; // Moved Permanently
    static const http_result_t HTTP_302; // Found
    static const http_result_t HTTP_303; // See Other
    static const http_result_t HTTP_304; // Not Modified
    static const http_result_t HTTP_305; // Use Proxy
    static const http_result_t HTTP_307; // Temporary Redirect
    static const http_result_t HTTP_308; // Permanent Redirect

    // 4xx - client errors
    static const http_result_t HTTP_400; // Bad Request
    static const http_result_t HTTP_401; // Unauthorized
    static const http_result_t HTTP_402; // Payment Required
    static const http_result_t HTTP_403; // Forbidden
    static const http_result_t HTTP_404; // Not Found
    static const http_result_t HTTP_405; // Method Not Allowed
    static const http_result_t HTTP_406; // Not Acceptable
    static const http_result_t HTTP_407; // Proxy Authentication Required
    static const http_result_t HTTP_408; // Request Timeout
    static const http_result_t HTTP_409; // Conflict
    static const http_result_t HTTP_410; // Gone
    static const http_result_t HTTP_411; // Length Required
    static const http_result_t HTTP_412; // Precondition Failed
    static const http_result_t HTTP_413; // Payload Too Large
    static const http_result_t HTTP_414; // URI Too Long
    static const http_result_t HTTP_415; // Unsupported Media Type
    static const http_result_t HTTP_416; // Range Not Satisfiable
    static const http_result_t HTTP_417; // Expectation Failed
    static const http_result_t HTTP_418; // I'm a teapot
    static const http_result_t HTTP_421; // Misdirected Request
    static const http_result_t HTTP_422; // Unprocessable Entity
    static const http_result_t HTTP_423; // Locked
    static const http_result_t HTTP_424; // Failed Dependency
    static const http_result_t HTTP_425; // Too Early
    static const http_result_t HTTP_426; // Upgrade Required
    static const http_result_t HTTP_428; // Precondition Required
    static const http_result_t HTTP_429; // Too many requests
    static const http_result_t HTTP_431; // Request Header Fields Too Large
    static const http_result_t HTTP_451; // Unavailable For Legal Reasons
    
    // 5xx - server errors
    static const http_result_t HTTP_500; // Internal Server Error
    static const http_result_t HTTP_501; // Not Implemented
    static const http_result_t HTTP_502; // Bad Gateway
    static const http_result_t HTTP_503; // Service Unavailable
    static const http_result_t HTTP_504; // Gateway Timeout
    static const http_result_t HTTP_505; // HTTP Version Not Supported
    static const http_result_t HTTP_506; // Variant Also Negotiates
    static const http_result_t HTTP_507; // Insufficient Storage
    static const http_result_t HTTP_508; // Loop Detected
    static const http_result_t HTTP_509; // Bandwith Limit Exceeded
    static const http_result_t HTTP_510; // Not Extended
    static const http_result_t HTTP_511; // Network Authentication Required

    inline static const http_result_t * HTTPResultFromStatusNumber(int number)
    {
        switch (number) {
            // 1xx - Information
            case 100: return &HTTP_100;
            case 101: return &HTTP_101;
            case 102: return &HTTP_102;
            case 103: return &HTTP_103;

            // 2xx - Successful operations
            case 200: return &HTTP_200;
            case 201: return &HTTP_201;
            case 202: return &HTTP_202;
            case 203: return &HTTP_203;
            case 204: return &HTTP_204;
            case 205: return &HTTP_205;
            case 206: return &HTTP_206;
            case 207: return &HTTP_207;
            case 208: return &HTTP_208;
            case 226: return &HTTP_226;

            // 3xx - Redirection
            case 300: return &HTTP_300;
            case 301: return &HTTP_301;
            case 302: return &HTTP_302;
            case 303: return &HTTP_303;
            case 304: return &HTTP_304;
            case 305: return &HTTP_305;
            case 307: return &HTTP_307;
            case 308: return &HTTP_308;

            // 4xx - client errors
            case 400: return &HTTP_400;
            case 401: return &HTTP_401;
            case 402: return &HTTP_402;
            case 403: return &HTTP_403;
            case 404: return &HTTP_404;
            case 405: return &HTTP_405;
            case 406: return &HTTP_406;
            case 407: return &HTTP_407;
            case 408: return &HTTP_408;
            case 409: return &HTTP_409;
            case 410: return &HTTP_410;
            case 411: return &HTTP_411;
            case 412: return &HTTP_412;
            case 413: return &HTTP_413;
            case 414: return &HTTP_414;
            case 415: return &HTTP_415;
            case 416: return &HTTP_416;
            case 417: return &HTTP_417;
            case 418: return &HTTP_418;
            case 421: return &HTTP_421;
            case 423: return &HTTP_423;
            case 424: return &HTTP_424;
            case 425: return &HTTP_425;
            case 426: return &HTTP_426;
            case 428: return &HTTP_428;
            case 431: return &HTTP_431;
            case 451: return &HTTP_451;

            // 5xx - server errors
            case 500: return &HTTP_500;
            case 501: return &HTTP_501;
            case 502: return &HTTP_502;
            case 503: return &HTTP_503;
            case 504: return &HTTP_504;
            case 505: return &HTTP_505;
            case 506: return &HTTP_506;
            case 507: return &HTTP_507;
            case 508: return &HTTP_508;
            case 509: return &HTTP_509;
            case 510: return &HTTP_510;
            case 511: return &HTTP_511;

            default: return nullptr;
        }
    }


    inline static const http_result_t * HTTPResultFromStatusNumberStr(const char * numStr)
    {
        return numStr == nullptr ? nullptr : HTTPResultFromStatusNumber(atoi(numStr));
    }
};


/*---------------------------------------------------------------------------*/
/* class HTTPHeader                                                          */
/*---------------------------------------------------------------------------*/

class HTTPHeader {
protected:
    char * buffer;
    size_t bufferSize;
    size_t contentSize; // contentSize is not the Content-Size field, it is the size of the content of the header.
    struct {
        int major;
        int minor;
    } httpVersion;

    void GuaranteeSizeInBuffer(size_t sizeNeeded);

public:
    HTTPHeader();
    ~HTTPHeader();

    void SetHTTPVersion(int major, int minor);
    void SetHTTPResult(const HTTPLib::http_result_t * result);
    void SetContentSize(ulong64 size);
    void SetContentRange(ulong64 start, ulong64 end, ulong64 completeSize);
    void SetContentType(const char * contentType);
    void SetEncoding(HTTPLib::http_encoding_t enc);
    void SetETag(const char * etag);
    void SetConnection(HTTPLib::http_connection_t connection);
    void SetUpgrade(HTTPLib::http_upgrade_t upgrade);
    void SetWebsocketAcceptKey(const char * key);
    void SetCustomField(const char * field);
    void SetCustomField(const char * field, const char * value);
    void SetDate();
    void SetRequest(HTTPLib::http_request_method_t req, const char * resource);

    const char * GetHeaderData() { return buffer; }
    size_t GetHeaderSize() { return contentSize; }
};

/*---------------------------------------------------------------------------*/
/* class HTTPHeaderField                                                     */
/*---------------------------------------------------------------------------*/
class HTTPHeaderField {
protected:
    friend class HTTPParser;
    HTTPHeaderField() : values(nullptr), valueCount(0) {}
    ~HTTPHeaderField() {}

    const char ** values;
    size_t valueCount;

public:
    const char * GetValue(size_t idx) const { return values[idx]; }
    size_t GetValueCount() const { return valueCount; }
};


class HTTPRange {
public:
    HTTPRange() { this->next = nullptr; }
    virtual ~HTTPRange() {}

    enum {
        RANGE_NONE        = 0x00,
        RANGE_START_END   = 0x01,
        RANGE_START_ONLY  = 0x02,
        RANGE_LAST_BYTES  = 0x03
    } rangeType;
    ulong64 start;
    ulong64 end;
    HTTPRange * next;
};


class UHTTPParser {
public:
    virtual ~UHTTPParser() {}
    virtual bool HTTPParserValidateRequest(class HTTPParser * httpParser) = 0;
};


class HTTPParser {
    class HTTPHeaderLine * headerLineStart;
    class HTTPHeaderLine * headerLineEnd;
    char * curLineTmpBuf;
    size_t curLineTmpBufSize;
    int parserState;

    const HTTPLib::http_result_t * httpResultCode;
    HTTPLib::http_request_method_t reqMethod;
    char * firstLineBuffer;
    size_t firstLineBufferSize;
    char * requestTarget;
    char * requestParameters;
    bool requestLineLoaded;
    int httpVersion;

    class HTTPFieldList * fieldList;
    size_t fieldListBufferSize;
    HTTPLib::http_encoding_t acceptEncoding;
    ulong64 contentLength;
    int connectionType;
    const char * cookie;
    const char * contentType;
    const char * host;
    HTTPLib::http_upgrade_t upgradeType;
    HTTPRange * rangeListStart;
    HTTPRange * rangeListEnd;
    size_t rangeCount;
    HTTPLib::http_encoding_t encoding;

    // Special fields for websocket connections
    const char * websocketKey;
    int websocketVersion;
    const char * websocketProtocol;
    const char * origin;
    const char * etag;

    int parseResult;

    void Reset();
    class HTTPHeaderLine * CreateNewLine();
    size_t AddHeaderLines(char * data, size_t len);

    bool ParseResponseLine();
    bool ParseRequestLine(UHTTPParser * user);
    void ParseFieldLines(class HTTPHeaderLine * curLine);
    void SetFieldValue(const char * field, const char * value);

public:
    typedef enum {
        HTTP_PARSE_DONE,
        HTTP_PARSE_NEED_DATA,
        HTTP_PARSE_CANCEL,
        HTTP_PARSE_ERROR
    } parseresult_t;

    HTTPParser();
    ~HTTPParser();

    size_t ParseData(char * data, size_t len, UHTTPParser * user = nullptr);

    parseresult_t GetParseResult() const { return (parseresult_t)parseResult; }
    HTTPLib::http_encoding_t GetAcceptEncoding() const { return acceptEncoding; }
    HTTPLib::http_request_method_t GetRequestMethod() const { return reqMethod; }
    const char * GetRequestTarget() const { return requestTarget; }
    const char * GetRequestParameters() const { return requestParameters; }
    int GetMajorVersion() const { return httpVersion >> 8; }
    int GetMinorVersion() const { return httpVersion & 0x00FF; }
    int GetVersion() const { return httpVersion; }
    const HTTPHeaderField * GetHeaderField(const char * fieldName)  const;

    ulong64 GetContentLength() const { return contentLength; }
    bool IsConnectionType(HTTPLib::http_connection_t ct) const { return (connectionType & ct) != 0; }
    bool IsChunkedTransfer();
    const char * GetCookie() const { return cookie; }
    const char * GetETag() const { return etag; }
    const char * GetContentType() const { return contentType; }
    const char * GetHost() const { return host; }
    HTTPLib::http_upgrade_t GetUpgrade() const { return upgradeType; }
    const HTTPRange * GetRange() const { return rangeListStart; }
    size_t GetRangeCount() const { return rangeCount; }
    HTTPLib::http_encoding_t GetEncoding() const { return encoding; }

    const char * GetWebsocketKey() const { return websocketKey; }
    int GetWebsocketVersion() const { return websocketVersion; }
    const char * GetOrigin() const { return origin; }

    const HTTPLib::http_result_t * GetHTTPResultCode() const { return httpResultCode; }

    void GetFieldListCopy(byte * & buffer, size_t & bufferSize) const;
};
