import mongoose from "mongoose";


const ShortUrlSchema = new mongoose.Schema({
    longUrl: {
        type: String,
         // Enforce uniqueness
    },
    shortUrl: {
        type: String,
        unique:true
    },
    clickCount: {
        type: Number,
        default: 0,
    }
},
{
    versionKey: false,
});


  const ShortUrl = mongoose.model('shortUrl', ShortUrlSchema)
  export { ShortUrl as UrlModel}