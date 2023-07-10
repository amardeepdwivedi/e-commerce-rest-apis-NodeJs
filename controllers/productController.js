import { Product } from '../models';

import multer from 'multer';

import path from 'path';

import CustomErrorHandler from '../services/CustomErrorHandler';

import fs from 'fs';

import Joi from 'joi';

import productSchema from '../validators/productValidator';

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        // 3746674586-836534453.png
        cb(null, uniqueName);
    },
});

const handleMultipartData = multer({storage,limits: { fileSize: 1000000 * 10 },}).single('image'); // 5mb


const productController = {
    async store(req, res, next) {
        // Multipart form data
        handleMultipartData(req, res, async (err) => {
            if (err) {
                return next(CustomErrorHandler.serverError(err.message));
            }
            const filePath = req.file.path;

            // validation (import productSchema from '../validators/productValidator';)
            const { error } = productSchema.validate(req.body);
            if(error) {
                 // Delete the uploaded file
                 // rootfolder/uploads/filename.jpg
                    fs.unlink(`${appRoot}/${filePath}`, (err) => {
                      if(err) {
                    return next(CustomErrorHandler.serverError(err.message));
                      }
                 });
                 return next(error);
                 // rootfolder/uploads/filename.png 
            }   
                    
            // fetch all the data from the body 
            const { name, price, size } = req.body;
            let document;
            try {
                document = await Product.create({
                    name,
                    price,
                    size,
                    image: filePath
                });
            } catch (err) {
                return next(err);
            }
            console.log(req.file);
            res.status(201).json(document);
            
           // res.json({});
        });

    },
    // update a product...........
    update(req, res, next) {
        handleMultipartData(req, res, async (err) => {
            if (err) {
                return next(CustomErrorHandler.serverError(err.message));
            }
            let filePath;
            if (req.file) {
                filePath = req.file.path;
            }

            // validation (import productSchema from '../validators/productValidator';)
            const { error } = productSchema.validate(req.body);
            if (error) {
                // Delete the uploaded file
                if (req.file) {
                    fs.unlink(`${appRoot}/${filePath}`, (err) => {
                        if (err) {
                            return next(
                                CustomErrorHandler.serverError(err.message)
                            );
                        }
                    });
                }

                return next(error);
                // rootfolder/uploads/filename.png
            }

            const { name, price, size } = req.body;
            let document;
            try {
                document = await Product.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        name,
                        price,
                        size,
                        ...(req.file && { image: filePath }),
                    },
                    { new: true }
                );
                console.log(document);
            } catch (err) {
                return next(err);
            }
            res.status(201).json(document);
        });
    },

    // delete a product
    async destroy(req, res, next) {
        const document = await Product.findOneAndRemove({ _id: req.params.id });
        if (!document) {
            return next(new Error('Nothing to delete'));
        }
        // image delete
        const imagePath = document._doc.image;
        console.log(imagePath);
        // http://localhost:5000/uploads/1616444052539-425006577.png
        // approot/http://localhost:5000/uploads/1616444052539-425006577.png
        fs.unlink(`${appRoot}/${imagePath}`, (err) => {
            if (err) {
                return next(CustomErrorHandler.serverError());
            }
             return res.json(document); // file delete hone ke baad hi response chala jayega
        });
       // return res.json(document);
    },

    // get all products
    async index(req, res, next) {
        let documents;
        // pagination mongoose-pagination
        try {
            documents = await Product.find()
                .select('-updatedAt -__v')
                .sort({ _id: -1 }); // for descending order
        } catch (err) {
            return next(CustomErrorHandler.serverError());
        }
        console.log(documents);
        return res.json(documents);
    },

    // get single product
    async show(req, res, next) {
        let document;
        try {
            document = await Product.findOne({ _id: req.params.id }).select(
                '-updatedAt -__v'
            );
        } catch (err) {
            return next(CustomErrorHandler.serverError());
        }
        return res.json(document);
    },
}
export default productController; 