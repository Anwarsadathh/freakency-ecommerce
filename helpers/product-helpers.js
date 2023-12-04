var db=require('../config/connection')
var collection=require('../config/collections')
var objectId=require('mongodb').ObjectId


module.exports={
    addProduct:(product,callback)=>{
        console.log(product);

        db.get().collection('product').insertOne(product).then((data)=>{
                 console.log(data);
            callback(data.insertedId)
        })

    },
    getAllproducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
      },
      deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
          console.log(proId);
         console.log(objectId(proId));
          db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((response)=>{
            resolve(response)
          })
        })
      },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
            $set:{
              Name:proDetails.Name,
              Description:proDetails.Description,
              OfferPrice:proDetails.OfferPrice,
              Price:proDetails.Price,
              stock:parseInt(proDetails.stock),
              Category:proDetails.Category
            }
          }).then((response)=>{
            resolve()
          })
        })
      },
    //   getAllTshirt: () => {  //we use promise here
    //     return new Promise(async (resolve, reject) => {   //getting data should write in await 
    //         let products =await db.get().collection(collection.PRODUCT_COLLECTION).find({"category":"Shirt"}).toArray()  // toArray- convert into an array
    //         resolve(products)
    //     })

    // },
    viewCategory: (category) => {
      return new Promise(async (resolve, reject) => {
        let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
        resolve(category)
        console.log(category)
      })
    },
    getCategoryWiseProducts:(categoryId)=>{
      return new Promise(async(resolve,reject)=>{
        let categoryDetails=await db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(categoryId)})
        // console.log(categoryDetails)
        let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:categoryDetails.Name}).toArray()
        // console.log(products,"heyy")
        resolve(products)
      })
    },


    paginatorCount:(count)=>{
      return new Promise((resolve, reject) => {
        pages = Math.ceil(count/8 )
        let arr = []
        for (let i = 1; i <= pages; i++) {
            arr.push(i)
        }
        resolve(arr)
       })
    },
  
        // <------------------------------------TEN PRODUCTS SORT------------------------------------->
  
    getTenProducts: (Pageno) => {
      return new Promise(async (resolve, reject) => {
          let val = (Pageno - 1) * 8
          let AllProducts_ = await db.get().collection(collection.PRODUCT_COLLECTION)
              .find().sort({ _id: -1 }).skip(val).limit(8).toArray()
  
          resolve(AllProducts_)
      })
  },
  /* -------------------------------------------------------------------------- */
    /*                              product Sub total                             */
    /* -------------------------------------------------------------------------- */

    getSubTotalAmount: (userId) => {
      console.log('userId');
      console.log(userId);
      return new Promise(async (resolve, reject) => {
          let subtotal = await db.get().collection(collection.CART_COLLECTION).aggregate([

              {
                  $match: { user: objectId(userId) }
              },

              {
                  $unwind: '$products'
              },

              {
                  $project: {
                      item: '$products.item',
                      quantity: '$products.quantity'
                  }

              },
              {
                  $lookup: {
                      from: collection.PRODUCT_COLLECTION,
                      localField: 'item',
                      foreignField: '_id',
                      as: 'product'

                  }
              },
              {
                  $project: {
                      _id: 0,
                      quantity: 1,
                      product: { $arrayElemAt: ['$product', 0] }
                  }
              },

              {
                  $project: {
                      suBtotal: {
                          $multiply: [
                              {

                                  $toInt: '$quantity'
                              },
                              {
                                  $toInt: '$product.Price'
                              }]

                      }
                  }
              }



          ]).toArray()

          // console.log(subtotal);
          resolve(subtotal)
      })






  },


  /* -------------------------------------------------------------------------- */
  /*                                 subtotal                               */
  /* -------------------------------------------------------------------------- */


  getSubTotal: (detail) => {

      return new Promise(async (resolve, reject) => {
          let subtotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
              {
                  $match: { user: objectId(detail.user) }
              },
              {
                  $unwind: '$products'
              },
              {
                  $project: {
                      item: '$products.item',
                      quantity: '$products.quantity'
                  }
              }
              , {

                  $match: { item: objectId(detail.product) }
              },
              {
                  $lookup: {
                      from: collection.PRODUCT_COLLECTION,
                      localField: 'item',
                      foreignField: '_id',
                      as: 'product'
                  }
              },
              {
                  $project: {
                      _id: 0, quantity: 1, product: { $arrayElemAt: ["$product", 0] }

                  }
              },
              {
                  $project: {

                      //    total:{$sum:{$multiply:['$quantity','$product.price']}}
                      total: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.Price' }] }

                  }
              }

          ]).toArray()
          console.log(subtotal);
          if (subtotal.length != 0) {
              resolve(subtotal[0].total)
          } else {
              resolve()
          }

      })
  },

}