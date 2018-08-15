/*---------------------------------------------------------------------------*/
/* appsharing.h                                                              */
/* copyright (c) innovaphone 2018                                            */
/*                                                                           */
/*---------------------------------------------------------------------------*/

enum MessageType {
    DATA_MSG = 0,
    PALETTE_MSG = 7,
    DUMMY_MSG,
    NEW_PICTURE,
    STOP_SHARING,
    SEND_NAME,
    SEND_MOUSE_TYPE,
// Messages only intended for the an specific sender
    SEQ_LOST = 128,
    CONFIRM_SEQ,
    REQ_NEW_PIC,
    GIVE_CONTROL,
    TAKE_CONTROL,
    REQUEST_CONTROL,
    SEND_ID_WEB,
    REQUEST_NAME,
    DUMMY_MSG_RX,
    LBUTTONDOWN = 192,
    LBUTTONUP,
    LBUTTONDOWNDBLCLK,
    RBUTTONDOWN,
    RBUTTONUP,
    RBUTTONDOWNDBLCLK,
    MOUSEMOVE,
    MOUSEWHEEL,
    KEYPRESSED,
    KEYPRESSED_DOWN,
    KEYPRESSED_DOWN_UP,
    KEYPRESSED_UP,
// Used by Keyboard hook
    STOP_HOOK = 228,
// Used by the PBX, dummy_msg not useful here, a new app would be created!
    DISCARD_MSG = 254
};

enum MouseType {
    Arrow = 0,
    Hand,
    Wait,
    AppStarting,
    Ibeam,
    Cross,
    Help,
    No,
    SizeAll,
    SizeWs,
    SizeNwse,
    SizeWe,
    UpArrow
};

enum CompressionType {
    SAME_COLOR = 0,
    PNG = 1,
    JPEG
};

enum BlockType {
    BLOCK_MSG = 0,
    BLOCK_MSG_256,
    PLAIN_MSG,
    EQUAL_MSG
};

#define JPEG_MIN_SIZE   4
#define PNG_MIN_SIZE   45  // 33 + 12 header + end chunk

static const byte jpegHeader[2] = { 0xFF, 0xD8 };  // JPEG, Start of Image
static const byte pngHeader[8] = { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };  // PNG
static const byte pngHeader2[8] = { 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52 }; // IHDR

struct Png_infos {
    char name_png[256];
    int offset_png; //where we stopped last time we read the "file"
    unsigned char *datas_png;
};

typedef struct pixel_ {
    byte blue;
    byte green;
    byte red;
    byte alpha;
} pixel_t;

typedef struct rgb_ {
    byte blue;
    byte green;
    byte red;
} rgb_t;

#define INNO_HDR_FLAGS          0  // Offset 2
#define INNO_HDR_SEQ            2  // Offset 2
#define INNO_HDR_MSG_TYPE       4
#define INNO_HDR_APPL_ID        5
#define INNO_HDR_SENDER_ID      6
#define INNO_HDR_X_COOR         8
#define INNO_HDR_Y_COOR        10
#define INNO_HDR_X_DIM         12
#define INNO_HDR_Y_DIM         14
#define INNO_HDR_X_SIZE        16
#define INNO_HDR_Y_SIZE        18
#define INNO_HDR_RAW_COLOR     20
#define INNO_HDR_NUM_EQUAL     24
#define INNO_HDR_CRC_PNG256    28  // next three cannot appear in the same message
#define INNO_HDR_LENGTH        32  // basic header length

// 1.Mouse events
#define INNO_HDR_RECEIVER_ID   INNO_HDR_LENGTH+0
#define INNO_HDR_MSG_VK        INNO_HDR_LENGTH+2
#define ME_TOTAL_LENGTH        INNO_HDR_LENGTH+4

// 2.Packet Lost, confirm sequence, ... other events
//#define INNO_HDR_RECEIVER_ID   INNO_HDR_LENGTH+0
#define INNO_HDR_SEQ_NUM       INNO_HDR_LENGTH+2
#define OE_TOTAL_LENGTH        INNO_HDR_LENGTH+4
// 2.1 Number of lost Packets
#define INNO_HDR_NUM_LOST      INNO_HDR_LENGTH+4

// 3.Data messages
#define INNO_HDR_PKT_LEN       INNO_HDR_LENGTH

// 4.Conference
#define INNO_HDR_TARGET_ID     INNO_HDR_LENGTH

#define MAX_HEADER_LEN         INNO_HDR_LENGTH+6   // INNO_HDR_NUM_LOST

#define NUM_STANDARD_CURSORS      14
#define NUM_NON_STANDARD_CURSORS  5

class CompressedBlock {
public:
    CompressedBlock() {
        this->buf = NULL;
        this->len = 0;
        this->first = false;
        this->last = false;
    };
    ~CompressedBlock() { if(this->buf) free(this->buf); };

    int coorX;
    int coorY;
    int dimX;
    int dimY;
    int picW;
    int picH;
    word seq;
    enum CompressionType compressionType;
    enum BlockType blockType;
    int numEqBlocks;
    unsigned char *buf;
    int len;
    int msg;
    bool first;
    bool last;
};

class CompressedBlockNode : public istd::listElement<CompressedBlockNode> {
    int userId;
    int appId;
    bool retransmissions;
public:
    CompressedBlockNode(class CompressedBlock *pCompBlock, int userId, int appId, bool retransmissions) {
        this->pCompBlock = pCompBlock;
        this->retransmissions = retransmissions;
        this->appId = appId;
        this->userId = userId;
    };
    ~CompressedBlockNode() {
        if(pCompBlock) delete pCompBlock;
    }

    int GetUserId(void) { return userId; };
    int GetAppId(void) { return appId; };
    bool GetRetransmissions(void) { return retransmissions; };

    class CompressedBlock *pCompBlock;
};

class UCanvas {
public:
    virtual bool IsDesktopShared() = 0;
    virtual bool IsSharing(void) = 0;
    virtual bool GetApplicationPosition(unsigned int appId, int * coorX, int * coorY) = 0;
    virtual void SetWindowFront(unsigned int appId, int coorX, int coorY) = 0;
    virtual void Event(void * buf, size_t len) = 0;
    virtual void Send(void * buf, size_t len) = 0;
    virtual void SendTo(void * buf, size_t len, unsigned short senderId) = 0;
    virtual void Resend(unsigned short seq, unsigned short senderId) = 0;
    virtual void CloseComplete(void) = 0;
};

class ICanvas {
public:
    static ICanvas * CreateCanvas(class IIoMux * const iomux, class UCanvas * const user, class IInstanceLog * const log);
    virtual ~ICanvas() {};

    virtual void PutBlock(unsigned int userId, unsigned int appId, class CompressedBlock * block) = 0;
    virtual void DrawMouse(unsigned int userId, unsigned int appId, enum MouseType mouse, int coorX, int coorY) = 0;

    virtual void Add(unsigned int userId, char * userName, unsigned int appId, char * appName, char * appDesc) = 0;
    virtual void Update(unsigned int userId, char * userName, unsigned int appId, char * appName, char * appDesc) = 0;
    virtual void Remove(unsigned int userId, unsigned int appId) = 0;

    virtual void CloseCanvas(void) = 0;
};

class UFrameBuffer {
public:
    virtual void Add(unsigned int id, const char * name, const char * description, const char * icon,  const char * thumbnail, void * handle) {};
    virtual void Update(unsigned int id, const char * name, const char * description, const char * icon,  const char * thumbnail) {};
    virtual void Remove(unsigned int id) {};
    virtual void Event(void * buf, size_t len) {};
    virtual void HasData(unsigned int id) {};
    virtual void CloseComplete() {};
};


class IFrameBuffer {
public:
    static IFrameBuffer * CreateFrameBuffer(class IIoMux * const iomux, class UFrameBuffer * const user, class IInstanceLog * const log);

    virtual ~IFrameBuffer() {};
    virtual void Capture(unsigned int appId) = 0;  // MakeCapture, CreateDiffBlocks and CompressDiffBlocks

    virtual class CompressedBlock * GetNextBlock(unsigned int appId, bool retransmissions) = 0;
    virtual int GetNextBlockLen(unsigned int appId) = 0;
    virtual bool Mark(unsigned int appId, int coorX, int coorY, int dimX, int dimY) = 0;
    virtual void Clean(unsigned int appId) = 0;

    virtual void SubscribeApplications(void) = 0;
    virtual void UnsubscribeApplications(void) = 0;

    virtual void SetWindowFront(unsigned int appId, int coorX, int coorY) = 0;
    virtual bool GetApplicationPosition(unsigned int appId, int * coorX, int * coorY) = 0;
    virtual void SetMousePosition(int coorX, int coorY) = 0;
    virtual void RequestNewPicture(unsigned int appId) = 0;

    virtual void CloseFrameBuffer(void) = 0;
};
