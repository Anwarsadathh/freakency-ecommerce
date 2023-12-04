var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { response, use, options } = require('../app')
var ObjectId=require('mongodb').ObjectId
const Razorpay = require('razorpay');
const { uid } = require('uid')
const Otp=require('../config/OTP');
const Client=require('twilio')(Otp.accoundSid,Otp.authToken)
var moment = require('moment');
var paypal = require('paypal-rest-sdk');

var instance = new Razorpay({
  key_id: 'rzp_test_nAawGAbwhIQyoQ',
  key_secret: 'kKTOgUFBPohitHMGSpM7CAZq',
});


module.exports={
    // doSignup:(userData)=>{
    //    // userData.address={}
    //     return new Promise(async(resolve,reject)=>{
    //         userData.Password=await bcrypt.hash(userData.Password,10)
    //         db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
    //             resolve(data.insertedId)
    //         })     
         
    //     })
      
    // },
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
          // Check if the email or mobile already exists
          const existingUserEmail = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .findOne({ Email: userData.Email });
    
          const existingUserMobile = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .findOne({ Mobile: userData.Mobile });
    
          if (existingUserEmail && existingUserMobile) {
            // User with the same email and mobile already exists
            reject('User with the same email and mobile already exists');
          } else if (existingUserEmail) {
            // User with the same email already exists
            reject('User with the same email already exists');
          } else if (existingUserMobile) {
            // User with the same mobile already exists
            reject('User with the same mobile already exists');
          } else {
            // Hash the password
            userData.Password = await bcrypt.hash(userData.Password, 10);
    
            // Insert the new user
            db.get()
              .collection(collection.USER_COLLECTION)
              .insertOne(userData)
              .then((data) => {
                resolve(data.insertedId);
              })
              .catch((err) => {
                reject(err);
              });
          }
        });
      },
    
    
    
    


doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email });
  
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            if (user.block) {
              // User is blocked
              reject('This account is blocked. Please contact support for assistance.');
            } else {
              // Login success
              response.user = user;
              response.status = true;
              resolve(response);
            }
          } else {
            // Login failed
            resolve({ status: false });
          }
        });
      } else {
        // User not found
        resolve({ status: false });
      }
    });
  },
  
    addToCart:(proId,userId)=>{
        let proObj={
            item:ObjectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=> product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userId),'products.item':ObjectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })
                }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userId)},
                     {
                        
                            $push:{products:proObj}
                        
                     }
                ).then((response)=>{
                    resolve()
                })
            }
            }else{
                let cartObj={
                    user:ObjectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                $match:{user:ObjectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                        // Price:'$products.Price'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
                
            ]).toArray()
           console.log(cartItems,'>>>>>>>>>>>>>>>>>>>>>>>>>>');
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            if(cart){
                
                count=cart.products.length
                console.log(cart);
            } 
            resolve(count)
        })
    },
    // changeProductQuantity:(details)=>{
    //     details.count=parseInt(details.count)
    //     details.quantity=parseInt(details.quantity)
    //     console.log(details,"detail aaannn");
      
    //     return new Promise((resolve,reject)=>{
    //         if(details.count==-1 && details.quantity==1){
    //             db.get().collection(collection.CART_COLLECTION)
    //             .updateOne({_id:ObjectId(details.cart)},
    //             {
    //                 $pull:{products:{item:ObjectId(details.product)}}
    //             }).then((response)=>{
    //                 resolve({removeProduct:true})
    //             })
    //         }else{
    //         db.get().collection(collection.CART_COLLECTION)
    //          .updateOne({_id:ObjectId(details.cart), 'products.item':ObjectId(details.product)},
    //                 {
    //                      $inc:{'products.$.quantity':details.count}
    //                 }
    //                 ).then((response)=>{
    //                     resolve({status:true})
    //                 })
    //             }
    //     })
    // },
    changeProductQuantity:({cart,product,count,quantity})=>{
        let response={}
        
         count=parseInt(count)
         return new Promise(async(resolve,reject)=>{
 
             if(quantity==1&&count==-1){
                 response.decLimit=true
                 reject(response)
             }else{
                 if(count!=-1){
                     let stockCheck = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(product)})
                      if(quantity >= stockCheck.stock){
                         response.outOfStockErr=true
                         reject(response)
                     }else{
     
                         db.get().collection(collection.CART_COLLECTION)
                         .updateOne({'products.item':ObjectId(product),_id:ObjectId(cart)},
                         {
                             $inc:{'products.$.quantity':count}
                         }
                         
                         ).then(async(data)=>{
     
                          response.decLimit=false
                         response.outOfStockErr=false
                         resolve(response) 
                         }).catch((err)=>{
                             let error={}
                             error.message = "Something went wrong"
                             reject(error)
                         })
                     }
                 }else{
                     db.get().collection(collection.CART_COLLECTION)
                     .updateOne({'products.item':ObjectId(product),_id:ObjectId(cart)},
                     {
                         $inc:{'products.$.quantity':count}
                     }
                     
                     ).then(async(data)=>{
 
                      response.decLimit=false
                     response.outOfStockErr=false
                     resolve(response)  
                     }).catch((err)=>{
                         let error={}
                     error.message = "Something went wrong"
                     reject(error)
                     })
                 }        
                 }
         })
     },
 
    getTotalAmount:(userId)=>{
        console.log(userId,'////>>>>>>>//////////////////////////////');
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                $match:{user:ObjectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.Price']}}
                    }
                }
                
            ]).toArray()
          //console.log(total[0]?.total,"hellod total");
            resolve(total[0]?.total)
        })
    },
    getSubTotalAmount: (userId) => {
        console.log('userId');
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            let subtotal = await db.get().collection(collection.CART_COLLECTION).aggregate([

                {
                    $match: { user: ObjectId(userId) }
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
                                    $toInt: '$product.price'
                                }]

                        }
                    }
                }



            ]).toArray()

            // console.log(subtotal);
            resolve(subtotal)
        })






    },
    getSubTotal: (detail) => {

        return new Promise(async (resolve, reject) => {
            let subtotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(detail.user) }
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

                    $match: { item: ObjectId(detail.product) }
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
                        total: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.price' }] }

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



    // placeOrder:(order,products,total,userid)=>{
    //     console.log(order,'.orderrrrrrrrrrrrrrrrrrrrrrrrrr');
    //     //console.log(order.user,'orderb userrr');
    //     console.log(userid,'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh');
    //     return new Promise((resolve,reject)=>{
    //        console.log(order,products,total);
    //        let status=order['payment-method']==='COD'?'placed':'pending'
    //        let orderObj={
    //         deliveryDetails:{
    //             Name: order.Name,
    //             Phone: order.Phone,
    //             Email: order.Email,
    //             City: order.Town,
    //             state: order.state,
    //             Adress: order.adress,
    //             pincode: order.Pincode
    //         },
    //         userId:ObjectId(userid),
    //         paymentMethod:order['payment-method'],
    //         products:products,
    //         totalAmount:total,
    //         status:status,
    //         date:new Date()
    //        }
    //        db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
    //         db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectId(order.userId)})
    //         resolve(response.insertedId)
    //        })
    //     })

    // },
    placeOrder: (order, product, total, userId) => {
        return new Promise(async (resolve, reject) => {
            let adressid = order.selectedAdress
            let newadress = await db.get().collection(collection.USER_COLLECTION)
                .aggregate([
                    {
                        $match: { _id: ObjectId(userId) }
                    },
                    {
                        $unwind: '$adress'
                    },
                    {
                        $project: {
                            id: '$adress.id',
                            Name: '$adress.Name',
                            Mobile: '$adress.Phone',
                            Email: '$adress.Email',
                            address: '$adress.Adress',
                            city: '$adress.City',
                            State: '$adress.state',
                            Pincode: '$adress.pincode'
                        }
                    },
                    {
                        $match: { id: adressid }
                    }
                ]).toArray()
            let status = order.selectedPayment === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    Name: newadress[0].Name,
                    Mobile: newadress[0].Mobile,
                    Email: newadress[0].Email,
                    address: newadress[0].address,
                    city: newadress[0].city,
                    State: newadress[0].State,
                    pincode: newadress[0].Pincode,

                },
                userId: ObjectId(userId),
                PaymentMethod: order.selectedPayment,
                products: product,
                totalAmount: total,
                status: status,
                date: new Date()
                //userId:ObjectId(userid)       
            }
            if (order.couponcode) {

                await db.get().collection(collection.COUPEN_COLLECTION).updateOne({ code: order.couponcode },
                    {
                        $push: {
                            Users: ObjectId(order.userId)


                        }
                    }

                )
            }
            let balance 
            if(order.useWallet == '1'){
                console.log(order.useWallet,'orderwallet');
            if(user.wallet <= total){
                balance = 0
                orderObj.walletDiscount = order.walletDiscount
            }else{
                balance = user.wallet - total
                orderObj.walletDiscount = order.walletDiscount
            }
            let wallet = await db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(order.userId)},
                {
                    $set:{wallet:balance}
                })
                console.log('ended wi');
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(order.userId) })
                resolve(response.insertedId)
            })
        })
    },


    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            console.log(cart); 
            resolve(cart.products)
            console.log(cart.products);
            
        })
    },
    getUserOrders:(userId)=>{

        console.log(userId,"user aaan idh");
        return new Promise(async(resolve,reject)=>{
            console.log(userId);
            let orders=await db.get().collection(collection.ORDER_COLLECTION)
            .find({userId:ObjectId(userId)}).toArray()
            console.log(orders);
            resolve(orders)
        })
    },
  getOrderProducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
        let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{_id:ObjectId(orderId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity',
                    status:'$products.status',
                    date:1
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                }
            },
            {
                $project:{
                    date:1, status:1, item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            },
            {
                $addFields:{
                     convertPrice: { $toInt:'$product.ProductPrice'},
                    // convertPrice: { $toInt:'$product.ProductPrice'},
                }
             },
             {
                $project:{
                    
                   
                    date:1,totalAmount:{$multiply:['$quantity','$convertPrice']},quantity:1,product:1,status:1,Totalprice:1,deliveryDetails:1,

                }
             }
        ]).toArray()
        console.log((orderItems));
        resolve(orderItems)
    })
  },
  getOrderDetails:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
        try{
            let orderDetails = await   db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectId(orderId)}
                },
                {
                    $project:{
                        deliveryDetails:1,
                        TotalAmount:1,
                        TotalDiscount:1,
                        TotalPayment:1 ,
                        paymentmethod:1
                    }
                }

            ]).toArray()
            
                resolve(orderDetails[0])
        }catch(err){
            let error={}
            error.message = "Something went wrong"
            reject(error)
        }            
    })
},


updateOrderStatus:({orderId,proId,status})=>{
   return new Promise((resolve,reject)=>{
    db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId),
        "products":{$elemMatch:{"item":ObjectId(proId)}}},
        {$set:{"products.$.status":status}
    }).then((response)=>{
        resolve(response)   
    }).catch((err)=>{
        let error={}
            error.message = "Something went wrong"
            reject(error)
    })
   })
},
stockIncrement:({proId,quantity})=>{
    
    quantity=parseInt(quantity)
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(proId)},
            {
                $inc:{stock:quantity}
            }).then((response)=>{
                resolve(response)
            }).catch((err)=>{
                let error={}
                    error.message = "Something went wrong"
                    reject(error)
            })
    })

 },


//   deleteOrder:(orderId)=>{
//     return new Promise((resolve,reject)=>{
//       console.log(orderId);
//      console.log(ObjectId(orderId));
//       db.get().collection(collection.ORDER_COLLECTION).deleteOne({_id:ObjectId(orderId)}).then((response)=>{
//         resolve(response)
//       })
//     })
//   },
  cancelOrder: (orderId,user) => {

    let response ={}
    return new Promise(async (resolve, reject) => {

        console.log(orderId,"opoooooo");

  let order = await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:ObjectId(orderId)})


  console.log(order,"89898989");

  console.log(order.paymentMethod,"999999");
  if(order.paymentMethod != "COD"){
    console.log("yuyuiyiy");
    user.wallet = user.wallet +parseInt(order.totalAmount)
    console.log(user.wallet,'userwallet');
  let wallet =  await db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(order.userId)},
    {
        $set:{wallet:user.wallet}
    })
}

        db.get().collection(collection.ORDER_COLLECTION).updateOne({
            _id: ObjectId(orderId)


        },
            {
                $set: {
                    status: "Cancelled"

                }
            }).then((data) => {
                response.order = order
                console.log(response,"78787878");
                resolve(response)
            })


    })
},
setWalletHistory:(user,order,description,debit)=>{

    console.log(user,"iuiuiuiui");

    console.log(debit,"popoo");

   
    return new Promise(async(resolve,reject)=>{
         let walletDetails;

        if(debit){
        
         walletDetails = {
                date: new Date().toDateString(),
                orderId: order.orderId,
                amount: order.amount,
                description:description,
                debit: true
              };
        }
    

          else {

             walletDetails = {
                date: new Date().toDateString(),
                orderId: order.orderId,
                amount: order.amount,
                description:description,
                credit:true
              };


          }

          console.log(walletDetails,"haiiii");

      let userData = await db.get().collection(collection.USER_COLLECTION).findOne({_id: ObjectId(user._id)})


          console.log(userData,"900909");

          console.log(userData.walletHistory,"pippipip");
         console.log("tyytyty");
 
        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(user._id )},
        {
            $push: { walletHistory: walletDetails }
        }).then((response) => {
            resolve(response)
        })      

            

        })
    },




  getSingleProduct:(id)=>{
    return new Promise(async(resolve,reject)=>{
        let singleProduct=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(id)})
        //console.log(singleProduct,"//////////////////////////adffadf");
        resolve(singleProduct)
    })
  },

    // addAddress:(details,userId)=>{
    //     return new Promise(async(resolve,reject)=>{
    //         let user=await db.get().collection(collection.ADDRESS_COLLECTION).findOne({user:ObjectId(userId)})
    //         db.get().collection(collection.ADDRESS_COLLECTION).insertOne(details).then((datas)=>{
    //             resolve(datas,user)
    //         })     
         
    //     })
      
    // },
    generateRazorpay:(orderId,total)=>{

        console.log("userHelper il generateRazorpay de ullil");
        return new Promise(async(resolve,reject)=>{
            let order=await instance.orders.create({
                amount: total*100,
                currency: "INR",
                receipt: ""+orderId,
                notes: {
                  key1: "value3",
                  key2: "value2"
                }
              })
              console.log("New order:",order)

              resolve(order)
        })
    },
    verifyPayment:(details)=>{
        console.log("verifypayment userHelper inte ullil")
        return new Promise(async(resolve,reject)=>{
            const {createHmac} = await import('node:crypto');
            let hmac = createHmac('sha256', 'kKTOgUFBPohitHMGSpM7CAZq');

            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }

        })

    },
    changePaymentStatus:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:ObjectId(orderId)},
            {
                $set:{status:"Placed"}   

            }).then(()=>{
                resolve()
            })
        })
    },
    AddAdress: (userId, AdressData) => {
        
        return new Promise((resolve, reject) => {
            let count = uid()
            let adresobj = {
                id: count,
                Name: AdressData.Name,
                Phone: AdressData.Phone,
                Email: AdressData.Email,
                City: AdressData.Town,
                state: AdressData.state,
                Adress: AdressData.adress,
                pincode: AdressData.Pincode
            }
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id:ObjectId(userId) }, {
                $push: {
                    adress: adresobj
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    getUserAddress:(userId)=>{
        console.log(userId,"");
        return new Promise(async(resolve,reject)=>{
            let addressDetails=await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectId(userId)}
                },
                {
                    $unwind:'$adress'
                },
                {
                    $project:{
                        id:'$adress.id',
                        Name:'$adress.Name',
                        Phone: '$adress.Phone',
                        Email: '$adress.Email',
                        City: '$adress.City',
                        state: '$adress.state',
                        Adress: '$adress.Adress',
                        pincode: '$adress.pincode'
                    }
                },
               
        
            ]).toArray()
            console.log((addressDetails,'sssssssssssssssssssssssssssssssss'));
            resolve(addressDetails)
        })
      },
      removeAdress:(data)=>{
        return new Promise((resolve,reject)=>{
         console.log(data,"daaaa");
         console.log(data.userId,data.adressId,"daaaa");
         db.get().collection(collection.USER_COLLECTION)
                .updateOne({_id:ObjectId(data.userId)},
                {
                    $pull:{adress:{id:data.adressId}}
                }).then((response)=>{
                    resolve({removeAdress:true})
                })
          })
        
      },
      removeCartProduct:(details)=>{
        console.log(details,'lksdlksldksdlksdlskdl');
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:ObjectId(details.Id)},
            {
                $pull:{products:{item:ObjectId(details.cartId)}}
            }).then((response)=>{
                resolve({removeCartProduct:true})
            })
        })
      },
      getUserDatatoEdit:(userId)=>{
        console.log(userId,"lLLLLL")
        return new Promise(async(resolve,reject)=>{
            
                let userDetails= await  db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(userId)})
          
                resolve(userDetails)
            
          
        })
     },
     editUserData:(userData,userId)=>{
        let {Name}=userData
        let{Email}=userData
        let{Mobile}=userData
        let{Adress}=userData
        console.log(userId,"userId")
        
        us= ObjectId(userId)
        userId= us
        let response={}
        console.log(Name,Email,Mobile,Adress,userId)
        return new Promise(async(resolve,reject)=>{
            let userCheck=await db.get().collection(collection.USER_COLLECTION).findOne({Email:Email,_id:{$ne:userId}})
            console.log(userCheck)
            if(userCheck){
                response.mailExist=true
                response.errMessage="Email id already exists"
                reject(response)
            }else{
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:userId},{
                    $set:{
                        Name:Name,
                        Email:Email,
                        Mobile:Mobile,
                        Adress:Adress
                    }
                }).then(()=>{
                    response.successMessage="data upated successfully"
                    response.mailExist=false
                    resolve(response)
                })
            }
           
        })
     },
     doOTP:(userData)=>{
        let response={}
         return new Promise(async(resolve,reject)=>{
          let user=await db.get().collection(collection.USER_COLLECTION).findOne({Mobile:userData.phone})
          if(user){
  
            response.status=true
            response.user=user
            console.log("11111111111111")
            Client.verify.services(Otp.serviceId)
            .verifications
            .create({ to: `+91${userData.phone}`, channel: 'sms' })
            .then((data)=>{
              
             
            });
            resolve(response)
          }
          else{
            response.status=false;
            resolve(response)
          }
         })
  
      },
  
      doOTPConfirm:(confirmotp,userData)=>{
         return new Promise((resolve,reject)=>{
          
          console.log(userData)
          Client.verify.services(Otp.serviceId)
          .verificationChecks
          .create({
            to:`+91${userData.Mobile}`,
            code:confirmotp.phone
          })
          .then((data)=>{
            if(data.status=='approved'){
              resolve({status:true})
            }else{
              resolve({status:false})
            }
          })
         })
      },
      getUserWallet: (id) => {

        return new Promise(async (resolve, reject) => {

            await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(id) },{wallet:1}).then((data) => {
                console.log(data, 'dataaaaszzzxxsds');
                resolve(data)
            })
        })
    },
    /* -------------------------------------------------------------------------- */
/*                             SET WALLET HISTORY                             */
/* -------------------------------------------------------------------------- */


setWalletHistory:(user,order,description,debit)=>{

    console.log(user,"iuiuiuiui");

    console.log(debit,"popoo");

   
    return new Promise(async(resolve,reject)=>{
         let walletDetails;

        if(debit){
        
         walletDetails = {
                date: new Date().toDateString(),
                orderId: order.orderId,
                amount: order.amount,
                description:description,
                debit: true
              };
        }
    

          else {

             walletDetails = {
                date: new Date().toDateString(),
                orderId: order.orderId,
                amount: order.amount,
                description:description,
                credit:true
              };


          }

          console.log(walletDetails,"haiiii");

      let userData = await db.get().collection(collection.USER_COLLECTION).findOne({_id: ObjectId(user._id)})


          console.log(userData,"900909");

          console.log(userData.walletHistory,"pippipip");
         console.log("tyytyty");
 
        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(user._id )},
        {
            $push: { walletHistory: walletDetails }
        }).then((response) => {
            resolve(response)
        })      

            

        })
    },



    /* -------------------------------------------------------------------------- */
    /*                         Wallet history for viewing                         */
    /* -------------------------------------------------------------------------- */


    disWalletHistory:(user)=>{

        return new Promise (async(resolve,reject)=>{

            let his = await db.get().collection(collection.USER_COLLECTION).aggregate([

 
                {
                    $match : {_id:ObjectId(user)}
                },
                {
                    $unwind: "$walletHistory"
                },{
                    $project : { _id:0,walletHistory:1}
                }

            ]).toArray()

            console.log(his,"ytrevvx");
            resolve(his)
        })
    },
    returnOrder: (order, user) => {
        return new Promise(async (resolve, reject) => {

            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(order.orderId) },
                {
                    $set: { status: 'Returned' }
                }).then(async (response) => {
                    console.log(user.wallet, "9999999");
                    console.log(order.amount, "888");
                    let amount = parseInt(order.amount) + user.wallet
                    let data = await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(user._id) },
                        {
                            $set: { wallet: amount }
                        })
                })
            // console.log('hhhhhhhhhhhhhh');
            resolve({ status: true })
        })
    },
   
     /* -------------------------------------------------------------------------- */
  /*                              Verifying Coupon                              */
  /* -------------------------------------------------------------------------- */

  couponVerify: (user) => {
    console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh');

    console.log(user);

    return new Promise(async (resolve, reject) => {

      let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(user) })
console.log(userCart,"yyyyyyyyyyy");

      if (userCart.coupon) {

        let coupenData = await db.get().collection(collection.COUPEN_COLLECTION).findOne({ _id: ObjectId(userCart.coupon) })

        resolve(coupenData)
        console.log(coupenData);


      }


      resolve(userCart)
      console.log("iiiiiiiiiiiiiiiiiiiiiiiii");
      console.log(userCart);
    })
  },
  getAllbanner:()=>{
    return new Promise(async(resolve,reject)=>{
        let banner= await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
        resolve(banner)
    })
  },    // <------------------------------------------ PAYPAL FUNCTION ------------------------------------------->
  createPay: (payment) => {
      return new Promise((resolve, reject) => {
          paypal.payment.create(payment, function (err, payment) {
              if (err) {
                  reject(err);
              }
              else {
                  resolve(payment);
              }
          });
      })
  },
  deletePendingOrder:(orderId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.ORDER_COLLECTION).deleteOne({_id:ObjectId(orderId)});
      resolve()
    })
},
  // <------------------------------------------ WISHLIST COUNT ------------------------------------------->
  getWishlistCount: (userId) => {
    return new Promise(async (resolve, reject) => {
        let count = 0
        let cart = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
        if (cart) {
            count = cart.product.length
        }
        resolve(count)
    })
},
// <------------------------------------------ HEADER DETAILS(CART,WISHLIST,WALLET) ------------------------------------------->
getHeaderDetails: (userId) => {
    return new Promise(async (resolve, reject) => {
       
        let ccount = 0
        let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
        if (cart) {
            ccount = cart.product.length
        }

        let obj = {}
        
        obj.cartCount = ccount
        
        resolve(obj)
    })
},
searchProducts: (key) => {
    return new Promise(async (resolve, reject) => {
        var re = new RegExp(key, 'i');
        let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({Name: re }).toArray()
        resolve(products)
    })
},
 }
   