var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
var ObjectId=require('mongodb').ObjectId
var moment = require('moment');


module.exports={
    getAllusers:()=>{
        return new Promise(async(resolve,reject)=>{

            let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    getUsersDetails:(usersId)=>{
      return new Promise((resolve,reject)=>{
          db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(usersId)}).then((users)=>{
              resolve(users)
          })
      })
  },
  updateUsers:(usersId,usersDetails)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(usersId)},{
          $set:{
            Name:usersDetails.Name,
            Email:usersDetails.Email,
            Mobile:usersDetails.Mobile
          }
        }).then((response)=>{
          resolve()
        })
      })
    },
    blockuser:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},{
                $set:{
                    block:true
                }
            })
        })
    },
    unblockuser:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},{
                $set:{
                    block:false
                }
            })
        })
    },
    deleteProduct:(userId)=>{
        return new Promise((resolve,reject)=>{
          console.log(userId);
         console.log(ObjectId(userId));
          db.get().collection(collection.USER_COLLECTION).deleteOne({_id:ObjectId(userId)}).then((response)=>{
            resolve(response)
          })
        })
      },
      addCategory:(bodyContent)=>{
        return new Promise(async(resolve,reject)=>{
           
          bodyContent.Name=bodyContent.Name.toUpperCase(); 
          let categoryNameExist= await db.get().collection(collection.CATEGORY_COLLECTION).findOne({Name:bodyContent.Name})
          console.log(categoryNameExist)
           
          if(!categoryNameExist){
          
             await db.get().collection(collection.CATEGORY_COLLECTION).insertOne(bodyContent).then(()=>{ 
              console.log('inside existance') 
              resolve({permission:true})
           })
           }
           else{
            
             resolve({permission:false})
           }
         })
      },
    getAllcategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let category= await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
      },
      deleteCategory:(catId)=>{
        return new Promise((resolve,reject)=>{
          console.log(catId);
         console.log(ObjectId(catId));
          db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:ObjectId(catId)}).then((response)=>{
            resolve(response)
          })
        })
      },
      getCategoryDetails:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:ObjectId(catId)}).then((category)=>{
                resolve(category)
            })
        })
    },
    updateCategory:(catId,catDetails)=>{
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:ObjectId(catId)},{
            $set:{
              Name:catDetails.Name,
              Description:catDetails.Description,
            }
          }).then((response)=>{
            resolve()
          })
        })
      },
      getUserOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            
            let orders=await db.get().collection(collection.ORDER_COLLECTION)
            .find().toArray()
            console.log(orders);
            resolve(orders)
        })
    },
 
    deleteOrder:(orderId)=>{
      return new Promise((resolve,reject)=>{
        console.log(orderId);
       console.log(ObjectId(orderId));
        db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},{
          $set:{ 
         status:'Cancel'
          }
        })
        resolve()
      })
    },
    UpdateStatus: (StatusData) => {
      let Cancel
      let Return
      if (StatusData.status == 'Cancelled') {
          Cancel = false
      } else {
          Cancel = true
      }
      if (StatusData.status == 'Delivered') {
          Return = true
          Cancel = false
      } else {
          Return = false
      }
      return new Promise((resolve, reject) => {
          db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(StatusData.cartId) }, {
              $set: {
                  status: StatusData.status,
                  Return: Return,
                  Cancel: Cancel
              }
          })
          resolve({ ok: true })
      })
  },
  
  cancelOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {

      console.log(orderId,"opoooooo");

      let order = await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:ObjectId(orderId)})


      console.log(order,"89898989");
    //   if(order.paymentMethod != 'COD'){
    //     // user.wallet = user.wallet +parseInt(order.totalAmount)
    //     // console.log(user.wallet,'userwallet');
    //   let wallet =  await db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(order.userId)},
    //     {
    //         $set:{wallet:user.wallet}
    //     })
    // }

      db.get().collection(collection.ORDER_COLLECTION).updateOne({
        _id: ObjectId(orderId)


      },
        {
          $set: {
            status: "Cancelled"

          }
        }).then((data) => {
          resolve(data)
        })


    })
  },


  /* -------------------------------------------------------------------------- */
  /*                               Shipped Orders                               */
  /* -------------------------------------------------------------------------- */

  shippedOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {

      db.get().collection(collection.ORDER_COLLECTION).updateOne({
        _id: ObjectId(orderId)


      },
        {
          $set: {
            status: "Shipped"

          }
        }).then((data) => {
          resolve(data)
        })


    })
  },

  /* -------------------------------------------------------------------------- */
  /*                              Delivered Orders                              */
  /* -------------------------------------------------------------------------- */

  deliveredOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {

      db.get().collection(collection.ORDER_COLLECTION).updateOne({
        _id: ObjectId(orderId)

      },
        {
          $set: {
            status: "Delivered"

          }
        }).then((data) => {
          resolve(data)
        })


    })
  },
  
  /* -------------------------------------------------------------------------- */
  /*                         DonutChartData for Payments                        */
  /* -------------------------------------------------------------------------- */


  doNutchartData: () => {

    return new Promise(async (resolve, reject) => {

      let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

        {
          $group: {
            _id: "$PaymentMethod",
            count: {
              $sum: 1
            }
          }
        },
        // {
        //   $project:{

        //   }
        // }

      ]).toArray()
      console.log(order,'llllllllllllllll')
      resolve(order)
    })

  },


  /* -------------------------------------------------------------------------- */
  /*                             order status graph                             */
  /* -------------------------------------------------------------------------- */

  piechartData: () => {

    return new Promise(async (resolve, reject) => {

      let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1
            }
          }
        },

      ]).toArray()
      console.log(order, "**********************")
      resolve(order)
    })

  },


//   /* -------------------------------------------------------------------------- */
//   /*                           bar charts for paymenst                          */
//   /* -------------------------------------------------------------------------- */

  barchartData: () => {

    return new Promise(async (resolve, reject) => {

      let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

        {
          $match: {
            "status": { $nin: ['Cancelled', 'pending'] }

          }
        }, {
          $group: {
            _id: '$PaymentMethod',
            totalAmount: {
              $sum: "$totalAmount"
            }
          }
        }

      ]).toArray()
      console.log(order, "99999999999999999999999999")
      resolve(order)
    })

  },


//   /* -------------------------------------------------------------------------- */
//   /*                            line Charts of sales                            */
//   /* -------------------------------------------------------------------------- */

  yearlyChart: () => {
    return new Promise(async (resolve, reject) => {

      let yearChart = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        // {

        //   $project: {

        //     year: {
        //       $year: '$date'
        //     },
        //     totalAmount: 1
        //   }
        // }, 
        {
          $group: {
            _id: "$year",
            totalAmount: {
              $sum: "$totalAmount"
            }
          }
        }, {

          $sort: {
            _id: 1
          }

        },
        {

          $limit: 10
        }



      ]).toArray()
      console.log(yearChart,'5');
      resolve(yearChart)
    })



  },


//   /* -------------------------------------------------------------------------- */
//   /*                               get Total Sales for dashboard                */
//   /* -------------------------------------------------------------------------- */




  getDailySales: () => {
    return new Promise(async (resolve, reject) => {

      let dailysales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": { $nin: ['cancelled'] }
          }
        },
        {
          $project: {
            date: { $dateToString: { format: "%Y-%m-%d", date: '$date' } }, _id: 1, totalAmount: 1
          }
        },

        {
          $group: {
            _id: "$date",
            totalAmount: {
              $sum: "$totalAmount"
            }
          }
        },
        {
          $sort: { _id: 1 }
        }

        // {
        //   $count: 'date'
        // }

      ]).toArray()
      resolve(dailysales)
      // console.log(",**************");
       console.log(dailysales,"pppppppppppppppp");
    })
  },


//   /* -------------------------------------------------------------------------- */
//   /*                       get total orders for dashboard                       */
//   /* -------------------------------------------------------------------------- */

  getDailyOrders: () => {
    return new Promise(async (resolve, reject) => {

      let dailyorders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": { $nin: ['cancelled'] }
          }
        },
        {
            $project: {
            torders:  moment().format('MMMM Do YYYY, h:mm:ss a'), _id: 1
          }
         
        },



        {
          $count: 'torders'
        }

      ]).toArray()
      resolve(dailyorders)
      // console.log(",**************");
       console.log(dailyorders,'jjjjjjjjjjjjjjjjjjjjj');
    })
  },

//   /* -------------------------------------------------------------------------- */
//   /*                        get total users for dashboard                       */
//   /* -------------------------------------------------------------------------- */

  getTotalUsers: () => {
    return new Promise(async (resolve, reject) => {

      let TotalUsers = await db.get().collection(collection.USER_COLLECTION).aggregate([
        // {
        //   $match: {
        //     "state": { $nin: [false] }
        //   }
        // },
        {
          $project: {
            user: { _id: 1 }
          }
        },



        {
          $count: 'user'
        }

      ]).toArray()
      resolve(TotalUsers)
      // console.log(",**************");
      // console.log(TotalUsers);
    })
  },

//   /* -------------------------------------------------------------------------- */
//   /*                     get total block users for dashboard                    */
//   /* -------------------------------------------------------------------------- */

  getTotalInactiveUsers: () => {
    return new Promise(async (resolve, reject) => {

      let TotalInactiveUsers = await db.get().collection(collection.USER_COLLECTION).aggregate([
        {
          $match: {
            "state": { $nin: [true] }
          }
        },
        {
          $project: {
            user: { _id: 1 }
          }
        },



        {
          $count: 'user'
        }

      ]).toArray()
      resolve(TotalInactiveUsers)
      console.log(",**************");
      console.log(TotalInactiveUsers);
    })
  },




//   /* -------------------------------------------------------------------------- */
//   /*                       daily sales with specified date                      */
//   /* -------------------------------------------------------------------------- */

  getDailySalespro: (day) => {
    return new Promise(async (resolve, reject) => {

      let dailysales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": { $nin: ['cancelled'] }
          }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            totalAmount: 1,
            date: 1,
            status: 1,
            Name:1,  
            _id: 1,
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
            date: moment().format('MMMM Do YYYY, h:mm:ss a'), totalAmount: 1, PaymentMethod: 1, item: 1, product: { $arrayElemAt: ['$product', 0] }, quantity: 1
          }
        },
        {
          $match: { date: day }
        },
        {
          $group: {
            _id: '$item',
            quantity: { $sum: '$quantity' },
            totalAmount: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.price' }] } },
            name: { $first: '$product.name' },
            date: { $first: '$date' },
            price: { $first: '$product.price' },
          }
        },
        {
          $sort: { _id: 1 },
        }
      ]).toArray()
      resolve(dailysales)
      console.log(dailysales,"akjs***********");
      console.log(dailysales);
    })
  },


//   /* -------------------------------------------------------------------------- */
//   /*                    get monthly sale with specified date                    */
//   /* -------------------------------------------------------------------------- */



  getMonthlySalesPro: (day) => {
    return new Promise(async (resolve, reject) => {

      let sales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": { $nin: ['cancelled'] }
          }
        },
        {
          $group: {
            _id: { month: { $month: { $toDate: '$date' } } },
            totalSaleMonth: { $sum: '$totalAmount' }
          }
        },
        {
          $match: {
            dates: day
          }
        },
        // {
        //   $group: {
        //     _id: '$date',
        //     totalAmount: { $sum: '$totalAmount' },
        //     count: { $sum: 1 }
        //   }
        // },
        {
          $sort: { _id: 1 }
        }

      ]).toArray()
      console.log(sales,'kjkjjj');
      resolve(sales)
    })

  },


//   /* ------------------------------- daily sales graph  ------------------------------ */
  salesGraph: () => {
    return new Promise(async (resolve, reject) => {
        let sales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            // {
            //     $match:{
            //         status:'placed'
            //     }
            // },
            {
                $project: { date: 1, totalAmount: 1 }
            },
            {
                $group: {
                    _id: moment().format('MMMM Do YYYY, h:mm:ss a'),
                    totalAmount: { $sum: '$totalAmount' },

                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            {
              $limit: 7
            }

        ]).toArray()
         console.log(sales,'kkkkkkkkkkkkkkkkkk');
        resolve(sales)
    })
},

// /* ------------------------------ monthly sales graph ------------------------------ */
salesMonthlyGraph: () => {
    return new Promise(async (resolve, reject) => {
        let sales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            // {
            //     $match:{
            //         status:'placed'
            //     }
            // },
            {
                $project: { date: 1, totalAmount: 1 }
            },
            {
                $group: {
                    _id: moment().format('MMMM Do YYYY, h:mm:ss a'),
                    totalAmount: { $sum: '$totalAmount' },

                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }

        ]).toArray()
        // console.log(sales);
        resolve(sales)
    })
},



//   /* -------------------------------------------------------------------------- */
//   /*                              get Monthly Sales                             */
//   /* -------------------------------------------------------------------------- */



  getMonthlySales: () => {

    return new Promise(async (resolve, reject) => {

      let monthlysale = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": { $nin: ['cancelled'] }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%m", date: "$date" } },
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          }
        },
        {
          $sort: { _id: 1 },
        }
      ]).toArray()
      resolve(monthlysale)
      console.log("akjhd");
      console.log(monthlysale);
    })





  },


//   /* -------------------------------------------------------------------------- */
//   /*                      Yearly Sales with specified Year                      */
//   /* -------------------------------------------------------------------------- */

  getYearlySalesPro: (day) => {
    return new Promise(async (resolve, reject) => {

      let sales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": { $nin: ['cancelled'] }
          }
        },
        {
          $project: {dates: moment().format('MMMM Do YYYY, h:mm:ss a'), totalAmount: 1, date: moment().format('MMMM Do YYYY, h:mm:ss a') }
        },
        {
          $match: {
            dates: day
          }
        },
        {
          $group: {
            _id: '$date',
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }

      ]).toArray()
      console.log(sales);
      resolve(sales)
    })

  },



//   /* -------------------------------------------------------------------------- */
//   /*                              get yearly sales                              */
//   /* -------------------------------------------------------------------------- */



  getyearlySales: () => {

    return new Promise(async (resolve, reject) => {

      let sale = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": { $nin: ['cancelled'] }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y", date: "$date" } },
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          }
        },
        {
          $sort: { _id: 1 },
        }
      ]).toArray()
      resolve(sale)
      console.log(sale);
    })





  },
/* -------------------------------------------------------------------------- */
  /*                                 Add Coupon                                 */
  /* -------------------------------------------------------------------------- */

  addCoupon: (couponDetails) => {
    return new Promise(async (resolve, reject) => {
      // couponDetails.endingdate = new Date(couponDetails.endingdate)
      // console.log(couponDetails, "iahaka");
      let response = {}
      let couponExist = await db.get().collection(collection.COUPEN_COLLECTION).findOne({ code: couponDetails.code })

      if (couponExist) {
        response.status = true
        response.message = "Coupon With this Code Already Exist"
        resolve(response)
      } else {
        await db.get().collection(collection.COUPEN_COLLECTION).insertOne({ name: couponDetails.name, code: couponDetails.code, endingdate: couponDetails.endingdate, value: couponDetails.value, minAmount: couponDetails.minAmount, maxAmount: couponDetails.maxAmount, status: true }).then((response) => {
          response.message = 'Coupon Added successfully'
          response.status = false
          resolve(response)
        })
      }

    })
  },
  viewCoupens: (coupen) => {
    return new Promise(async (resolve, reject) => {
      let coupen = await db.get().collection(collection.COUPEN_COLLECTION).find().toArray()
      resolve(coupen)
      console.log(coupen)
    })
  },
  applyCoupon: (details, userId, date,totalAmount) => {
    return new Promise(async (resolve, reject) => {
      let response = {}
      // let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({couponId:details.coupon})
      let coupon = await db.get().collection(collection.COUPEN_COLLECTION).findOne({ code: details.coupon, status: true })
      console.log(coupon, 'couponpre');
      // console.log(expDate);
      // console.log(coupon.status);

      if (coupon) {
        const expDate = new Date(coupon.endingdate)
        response.couponData = coupon
        let user = await db.get().collection(collection.COUPEN_COLLECTION).findOne({ code: details.coupon, Users: ObjectId(userId) })
        if (user) {
          response.used = "Coupon Already Used"
          resolve(response)
        } else {

          if (date <= expDate) {

            response.dateValid = true
            // response.Coupenused = false

            resolve(response)
            let total = totalAmount
            // let total = 24000;
            console.log(total, 'total');
            console.log(coupon.minAmount, 'kkkkmin');
            console.log(coupon.maxAmount, 'kkkkkmax');

            if (total >= coupon.minAmount) {
              console.log('amount heloooo');
              response.verifyminAmount = true
              // response.Coupenused = false

              resolve(response)

              if (total <= coupon.maxAmount) {
                console.log('amountmax heloooo');
                response.verifymaxAmount = true
                //  response.Coupenused = false

                resolve(response)
              } else {
                response.maxAmountMsg = 'Your maximum purchase should be' + coupon.maxAmount
                response.maxAmount = true
                // console.log(response.maxAmount,'resmaxamount');
                resolve(response)
              }

            } else {
              response.minAmountMsg = 'Your minimum purchase should be' + coupon.minAmount
              response.minAmount = true
              resolve(response)
            }




          } else {
            response.invalidDateMsg = 'Coupon Expired'
            response.invalidDate = true
            response.Coupenused = false

            resolve(response)
            console.log('invalid date');
          }


        }
      } else {
        response.invalidCoupon = true
        response.invalidCouponMsg = ' Invalid Coupon '
        resolve(response)
      }

      if (response.dateValid && response.verifymaxAmount && response.verifyminAmount) {
        response.verify = true
        // db.get().collection(collection.COUPON_COLLECTION).updateOne({couponId:details.coupon},
        //     {
        //         $push:{users:objectId(userId)}
        //     })

        db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) }, {

          $set: {
            coupon: ObjectId(coupon._id)
          }
        })

        resolve(response)
        console.log('hi heloo');
      }
    })
  },


  addBanner:(banner,callback)=>{
    console.log(banner);

    db.get().collection('banner').insertOne(banner).then((data)=>{
             console.log(data);
        callback(data.insertedId)
    })

},
getAllbanner:()=>{
  return new Promise(async(resolve,reject)=>{
      let products= await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
      resolve(products)
  })
},
getBannerDetails:(proId)=>{
  return new Promise((resolve,reject)=>{
      db.get().collection(collection.BANNER_COLLECTION).findOne({_id:ObjectId(proId)}).then((banner)=>{
          resolve(banner)
      })
  })
},
updateBanner:(BanId,BanDetails)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection(collection.BANNER_COLLECTION).updateOne({_id:ObjectId(BanId)},{
      $set:{
        Name:BanDetails.Name,
        Description:BanDetails.Description,
       
      }
    }).then((response)=>{
      resolve()
    })
  })
},
deleteProduct:(BanId)=>{
  return new Promise((resolve,reject)=>{
    console.log(BanId);
   console.log(ObjectId(BanId));
    db.get().collection(collection.BANNER_COLLECTION).deleteOne({_id:ObjectId(BanId)}).then((response)=>{
      resolve(response)
    })
  })
},

setDeliveryStatus:(status,orderId)=>{
  return new Promise((resolve,reject)=>{
    if(status == 'Cancelled'){
      db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},
      {
        $set:{
          status:status
         
        }
      })
    }else if(status == 'Delivered'){
      db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},
      {
        $set:{
          status:status
         
        }
      })
    }
    else{
      db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},
      {
        $set:{
          status:status
         
        }
      })
    }
    resolve(true)
  })
},
getDailySalespro: (day,dayend) => {
  console.log(day,"poopopopopppppppppppppppppppppppppppppppp");
    return new Promise(async (resolve, reject) => {

      let dailysales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            "status": { $nin: ['cancelled'] }
          }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            totalAmount: 1,
            date: 1,
            status: 1,
            _id: 1,
            item: '$products.item',
            quantity: '$products.quantity',
            date: { $dateToString: { format: "%Y-%m-%d", date: '$date' } }

          }
        },
        {
          $match: { $and: [{ date: { $gte: day } }, { date: { $lte: dayend } }] }
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
          $project:{
            Name:'$product.Name',
            Price:'$product.Price',
            totalAmount: 1,
            date: 1,
            
            _id: '$item',
            item: 1,
            quantity: 1,
            

          }
         },
//          {
// $group:{
//   _id: '$Name',
//   quantity: { $sum: '$quantity' },
//   total: { $sum: '$Price' }
// }
//          },
        // {
        //   $group: {
        //     _id: '$item',
        //     quantity: { $sum: '$quantity' },
        //     totalAmount:{ $sum:'$Price' },
        //     // name: { $first: '$product.name' },
        //     date: { $first: '$date' },
        //      //Price: { $first: '$product.price' },
        //   }
        // },
        {
          $sort: { date: 1 },
        }
      ]).toArray()
      resolve(dailysales)
      console.log(",akgjhbjs*****");
      console.log(dailysales,'dailysalwes');
    })
  },
  // getDailySalespro: (day,dayend) => {
  //   return new Promise(async (resolve, reject) => {

  //     let dailysales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
  //       {
  //         $match: {
  //           "status": { $nin: ['cancelled'] }
  //         }
  //       },
  //       {
  //         $unwind: '$products'
  //       },
  //       {
  //         $project: {
  //           totalAmount: 1,
  //           date: 1,
  //           status: 1,
  //           _id: 1,
  //           item: '$products.item',
  //           quantity: '$products.quantity'

  //         }
  //       }, {
  //         $lookup: {
  //           from: collection.PRODUCT_COLLECTION,
  //           localField: 'item',
  //           foreignField: '_id',
  //           as: 'product'
  //         }
  //       },
  //       {
  //         $project: {
  //           date: { $dateToString: { format: "%Y-%m-%d", date: '$date' } }, totalAmount: 1, paymentMethod: 1, item: 1, product: { $arrayElemAt: ['$product', 0] }, quantity: 1
  //         }
  //       },
  //       {
  //         $match: { $and: [{ date: { $gte: day } }, { date: { $lte: dayend } }] }
  //       },
  //       {
  //         $group: {
  //           _id: '$item',
  //           quantity: { $sum: '$quantity' },
  //           totalAmount: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.Price' }] } },
  //           name: { $first: '$product.Name' },
  //           date: { $first: '$date' },
  //           price: { $first: '$product.Price' },
  //         }
  //       },
  //       {
  //         $sort: { date: 1 },
  //       }
  //     ]).toArray()
  //     resolve(dailysales)
  //     console.log(",akjs*****");
  //     console.log(dailysales);
  //   })
  // },

  // getDailySalespro: (day,dayend) => {
  //   return new Promise(async (resolve, reject) => {

  //     let dailysales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
  //       {
  //         $match: {
  //           "status": { $nin: ['cancelled'] }
  //         }
  //       },
  //       {
  //         $unwind: '$products'
  //       },
  //       {
  //         $project: {
  //           totalAmount: 1,
  //           date: 1,
  //           status: 1,
  //           _id: 1,
  //           item: '$products.item',
  //           quantity: '$products.quantity'

  //         }
  //       }, {
  //         $lookup: {
  //           from: collection.PRODUCT_COLLECTION,
  //           localField: 'item',
  //           foreignField: '_id',
  //           as: 'product'
  //         }
  //       },
  //       {
  //         $project: {
  //           date: { $dateToString: { format: "%Y-%m-%d", date: '$date' } }, totalAmount: 1,Name:1, paymentMethod: 1, item: 1, product: { $arrayElemAt: ['$product', 0] }, quantity: 1
  //         }
  //       },
  //       {
  //        // $match: { date:   {
  //           //$gte: new Date(day).toISOString(),
  //           //$lte: new Date(dayend).toISOString()
  //           $match: { $and: [{ date: { $gte: day } }, { date: { $lte: dayend } }] }
  //      // } }
  //       },
  //       {
  //         $group: {
  //           _id: '$item',
  //           quantity: { $sum: '$quantity' },
  //           totalAmount: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.Price' }] } },
  //           name: { $first: '$product.Name' },
  //           date: { $first: '$date' },
  //           price: { $first: '$product.Price' },
  //         }
  //       },
  //       {
  //         $sort: { date: 1 },
  //       }
  //     ]).toArray()
  //     resolve(dailysales)
  //     console.log(",akjs*****");
  //     console.log(dailysales);
  //     //test:$dateToString : { format: "%Y-%m-%d", date: day }
  //     console.log('gfgkkkkk');
  //   })
  // },
}