/*----------------------------------------------------------------------------*/
/* transliterator.h                                                                 	  */
/* copyright (c) innovaphone 2010                                             */
/*                                                                            */
/*----------------------------------------------------------------------------*/

/*class transliterator
{
public:
    typedef struct {
        const char * i; // utf8-encoded string with one or more ucs2 source characters
        const char * o; // utf8-encoded string holding one or more ucs2 destination characters

    } MapEntryUtf8;

    // utf8 / punycode and vice versa
    static void TransformWords(const char * wordsIn, std::list<const char *> wordsOut);
    static bool SetRuleBasedTransliteration1(MapEntryUtf8 * map, unsigned szMap);

protected:
    typedef std::map<word, word *> TUCS2CharToStringMap;
    static TUCS2CharToStringMap ucs2CharToStringMap;

    static void Transform(const char * s1, const char * & s2);
    static const word * MapUCS2CharToString(word ucs2Char);
    static void MapUCS2Set(word ucs2Char, word * ucs2String, unsigned len);
    static void MapUCS2Remove(word ucs2Char);

};*/

/*---------------------------------------------------------------------------*/
/* class Transliterator		                                         */
/*---------------------------------------------------------------------------*/
class Transliterator {
public:
    typedef struct {
        const char * i; // utf8-encoded string with one or more ucs2 source characters
        const char * o; // utf8-encoded string holding one or more ucs2 destination characters

    } MapEntryUtf8;

    typedef std::map<word, word *> TUCS2CharToStringMap;
    TUCS2CharToStringMap ucs2CharToStringMap;

    Transliterator();
    virtual ~Transliterator();

    //static Transliterator * Create();
    std::list<const char *> TransformWords(const char * wordsIn, bool unique);
    char * Transform(const char * wordIn);
    bool SetRuleBasedTransliteration1(MapEntryUtf8 * map, unsigned szMap);
    const word * MapUCS2CharToString(word ucs2Char);
    void MapUCS2Set(word ucs2Char, word * ucs2String, unsigned len);
    void MapUCS2Remove(word ucs2Char);
    void ToLower(char * s, unsigned &len);
    void ToLower(char * s);
};

