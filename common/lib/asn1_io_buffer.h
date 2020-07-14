
/*-----------------------------------------------------------------------------------------------*/
/* asn1_io_buffer.h                                                                              */
/* copyright (c) innovaphone 2019                                                                */
/*                                                                                               */
/*-----------------------------------------------------------------------------------------------*/

class asn1_in_buffer : public asn1_in {
    unsigned length;
    byte * data;
    unsigned ptr;
    int bit_count;
    dword current;

    struct _save_buffer {
        unsigned ptr;
        int bit_count;
        dword current;
    } save_buffer;
public:
    asn1_in_buffer(byte * data, unsigned length);

    bool bit();
    dword bit_field(int len);
    byte octet();
    void octet_field(byte * v, int len);
    void align();
    int left();
    void abort();
    int get_count();
    void set_count(int count);
    void skip(int count);
    void save();
    void restore();
    void get_reference(void * & buffer, int & offset) { buffer = &data[ptr]; offset = 0; };
};

class asn1_out_buffer : public asn1_out {
    void fix_malloc();
    int bit_count;
    dword current;
    byte * data;
    unsigned malloc_size;
    unsigned malloced;
    unsigned ptr;
public:
    asn1_out_buffer(unsigned malloc_size);
    void bit(bool v);
    void bit_field(dword v, int len);
    void octet(byte v);
    void octet_field(byte * v, int len);
    void align();
    void * new_stream(void * stream);
    void append(void * stream);
    dword length();
    void get_reference(void * & buffer, int & offset) { buffer = &data[ptr]; offset = 0; };
    byte * get_data(unsigned & len) { len = ptr; return data; };
};

struct asn1_out_stream {
    byte * data;
    unsigned ptr;
    unsigned malloced;
};