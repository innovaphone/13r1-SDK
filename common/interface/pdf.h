/*---------------------------------------------------------------------------*/
/* pdf.h                                                                     */
/* copyright (c) innovaphone 2017 - 2020                                     */
/*                                                                           */
/*---------------------------------------------------------------------------*/

class IPdfProvider * CreatePdfProvider();

class IPdfProvider {
public:
    virtual ~IPdfProvider() { };
    virtual class IPdf * CreatePdf(class IInstanceLog * log = 0) = 0;
};

class IPdf {
public:
    virtual ~IPdf() { };

    enum class InfoType {
        Author,
        Creator,
        Title,
        Subject,
        Keywords,
    };

    enum Compressions {
        CompressionNone     = 0x0,
        CompressionText     = 0x1,
        CompressionImage    = 0x2,
        CompressionMetaData = 0x4,
        CompressionAll      = 0xf,
    };

    enum Directions {
        DirectionPortrait,
        DirectionLandscape,
    };

    enum Sizes {
        SizeA4,
    };

    enum class DefaultFont {
        Courier,
        Helvetica,
        Times,
    };

    enum class FontWeight {
        Normal,
        Bold,
    };

    enum class FontStyle {
        Normal,
        Italic,
    };

    enum class TextHAlign {
        Left,
        Right,
        Center,
    };

    enum StreamTypes {
        StreamTypeCcittG31D,
    };

    virtual class IPdf &                    SetInfo(InfoType type, const char * info) = 0;
    virtual class IPdf &                    SetCompressionMode(unsigned compressionMode) = 0;
    virtual class IPdf &                    SetFont(const class IPdfFont * font) = 0;
    virtual class IPdf &                    SetFontSize(unsigned int fontSize) = 0;
    virtual class IPdf &                    SetMargin(float all) = 0;
    virtual class IPdf &                    SetMargin(float top, float right, float bottom, float left) = 0;

    virtual class IPdfFont *                AddFont(const char * fontFileName) = 0;
    virtual class IPdfFont *                AddFont(DefaultFont font = DefaultFont::Helvetica,
                                                    FontWeight weight = FontWeight::Normal,
                                                    FontStyle style = FontStyle::Normal) = 0;
    virtual const class IPdfColor *         AddColor(float gray) = 0;
    virtual class IPdfImage *               AddPngImage(const byte * data, unsigned int length) = 0;
    
    virtual class IPdfPage *                AddPage(enum IPdf::Sizes size = IPdf::SizeA4,
                                                    enum IPdf::Directions direction = IPdf::DirectionPortrait) = 0;

    virtual void                            Complete() = 0;         // Obsolete
    virtual void                            Get(const byte * & data, unsigned & length, bool * last = 0) = 0;
};

class IPdfColor {
protected:
    IPdfColor& operator=(const IPdfColor&) = default;
    ~IPdfColor() = default;
};

class IPdfDocumentPosition {
public:
    virtual class IPdfPage *                GetPage() const = 0;
    virtual float                           GetHorizontalPosition() const = 0;
    virtual float                           GetVerticalPosition() const = 0;
    virtual class IPdfDocumentPosition &    Move(float horizontalRight, float verticalDown) = 0;
    virtual class IPdfDocumentPosition &    MoveTo(const class IPdfDocumentPosition & position) = 0;
    virtual class IPdfDocumentPosition *    Clone() const = 0;

protected:
    IPdfDocumentPosition& operator=(const IPdfDocumentPosition&) = default;
    ~IPdfDocumentPosition() = default;
};

class IPdfPage {
public:
    virtual class IPdfPage *                    GetPreviousPage() = 0;
    virtual const class IPdfPage *              GetPreviousPage() const = 0;
    virtual class IPdfPage *                    GetNextPage() = 0;
    virtual const class IPdfPage *              GetNextPage() const = 0;

    virtual enum IPdf::Sizes                    GetSize() const = 0;
    virtual enum IPdf::Directions               GetDirection() const = 0;
    virtual float                               GetWidth() const = 0;
    virtual float                               GetHeight() const = 0;
    virtual const class IPdfDocumentPosition &  GetContentStart() const = 0;
    virtual const class IPdfDocumentPosition &  GetContentEnd() const = 0;

    virtual void                                SetSize(enum IPdf::Sizes size) = 0;
    virtual void                                SetDirection(enum IPdf::Directions direction) = 0;
    virtual void                                SetMargin(float all) = 0;
    virtual void                                SetMargin(float top, float right, float bottom, float left) = 0;
    

    virtual unsigned int                        AddText(const char *                        text,
                                                        const class IPdfDocumentPosition &  position,
                                                        IPdf::TextHAlign                    align = IPdf::TextHAlign::Left,
                                                        float                               maxWidth = 0,
                                                        float                               maxHeight = 0,
                                                        float *                             height = 0) = 0;

    virtual void                                AddImage(const class IPdfImage *    image,
                                                         float                      positionX,
                                                         float                      positionY,
                                                         float                      width,
                                                         float                      height) = 0;

    virtual void                                AddBackground(const class IPdfColor *               color,
                                                              const class IPdfDocumentPosition &    startPosition,
                                                              const class IPdfDocumentPosition &    endPosition) = 0;

    virtual void                                AddHorizontalLine(const class IPdfDocumentPosition &    startPosition,
                                                                  float                                 length,
                                                                  float                                 lineWidth,
                                                                  const class IPdfColor *               color) = 0;

    virtual class IPdfImageStream *             AddImageStream(enum IPdf::StreamTypes type) = 0;

    virtual class IPdfText *                    AddText(const class IPdfDocumentPosition * startPosition = 0) = 0;

    virtual class IPdfTable *                   AddTable(const class IPdfDocumentPosition * startPosition = 0) = 0;

    virtual void                                Complete() = 0;     // Obsolete

protected:
    virtual ~IPdfPage() { };
};

class IPdfImageStream {
public:
    virtual void Write(const byte * data, unsigned length) = 0;
    virtual void SetStreamWidth(unsigned int width) = 0;
    virtual void SetStreamHeight(unsigned int height) = 0;
    virtual void Draw(float x, float y, float width, float height) = 0;

protected:
    virtual ~IPdfImageStream() { };
};

class IPdfText {
public:
    virtual ~IPdfText() = default;

    virtual const class IPdfDocumentPosition &  GetPosition() const = 0;
    virtual class IPdfText &                    SetFont(const class IPdfFont * font,
                                                        const class IPdfFont * fontBold = 0,
                                                        const class IPdfFont * fontItalic = 0,
                                                        const class IPdfFont * fontBoldItalic = 0) = 0;
    virtual class IPdfText &                    SetTextAlign(IPdf::TextHAlign align) = 0;

    virtual class IPdfText &                    Add(const char * text, const class IPdfFont * font = 0, unsigned int fontSize = 0) = 0; 
    virtual class IPdfText &                    AddHTML(const char * text) = 0;
};

class IPdfTableHeader {
public:
    virtual class IPdfTableHeader &             SetFont(const class IPdfFont * font) = 0;
    virtual class IPdfTableHeader &             SetHorizontalLine(float width, const class IPdfColor * color) = 0;

protected:
    ~IPdfTableHeader() = default;
};

class IPdfTable {
public:
    virtual ~IPdfTable() = default;

    virtual const class IPdfDocumentPosition &  GetEndPosition() const = 0;

    virtual class IPdfTable &                   SetFont(const class IPdfFont * font) = 0;
    virtual class IPdfTable &                   SetContentMargin(float all) = 0;
    virtual class IPdfTable &                   SetContentMargin(float top, float right, float bottom, float left) = 0;
    virtual class IPdfTable &                   SetHorizontalLine(float width, const class IPdfColor * color) = 0;
    virtual class IPdfTable &                   SetEvenRowBackground(const class IPdfColor * color) = 0;
    virtual class IPdfTable &                   SetOddRowBackground(const class IPdfColor * color) = 0;

    virtual class IPdfTableHeader *             AddHeader() = 0;
    virtual class IPdfTableColumn *             AddColumn(float             width,
                                                          IPdf::TextHAlign  align = IPdf::TextHAlign::Left) = 0;
    virtual void                                AddRows(class UPdfTable *   user,
                                                        unsigned int        count = 1) = 0;
};

class UPdfTable {
public:
    virtual const char *    GetFieldContent(class IPdfTable *                   table,
                                            unsigned int                        row,
                                            unsigned int                        column,
                                            const class IPdfDocumentPosition &  startPosition,
                                            class IPdfDocumentPosition &        endPosition) = 0;

    virtual const char *    GetHeaderContent(class IPdfTable *                   table,
                                             unsigned int                        column,
                                             const class IPdfDocumentPosition &  startPosition,
                                             class IPdfDocumentPosition &        endPosition) { return 0; };
};

