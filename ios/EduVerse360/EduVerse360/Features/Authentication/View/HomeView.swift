//
//  HomeView.swift
//  EduVerse360
//
//  Created by Ekta Rai on 11/07/2026.
//

import SwiftUI

struct HomeView: View {
    var body: some View {
        ScrollView{
            ZStack(){
                Rectangle()
                    .fill(Color.primary)
                
                    .ignoresSafeArea()
                
                VStack(){
                    //logo part
                    VStack{
                        VStack(spacing:10) {
                            Text("EduVerse 360")
                                .foregroundColor(Color.white)
                                .font(.title)
                                .fontWeight(.semibold)
                            
                            Text("Join EduVerse 360")
                                .foregroundColor(Color.white)
                                .font(.largeTitle)
                                .fontWeight(.bold)
                        }
                        .padding()
                        
                        //Description
                        VStack(alignment:.center){
                            Text("The Complete Smart School Management Platform.Empowering educators, students, and parentsthrough the power of AI.")
                        }
                        .multilineTextAlignment(.center)
                        .foregroundColor(.homesecondarytext)
                        .padding(.horizontal)
                        
                        //Image
                        Image("home")
                            .resizable()
                            .scaledToFit()
                            .frame(maxWidth: 330)
                            .padding(.vertical)
                        
                        //Total Users
                        
                        HStack(spacing:20){
                            VStack(){
                                Text("500+")
                                    .foregroundColor(Color.white)
                                    .font(.title2)
                                    .fontWeight(.semibold)
                                Text("Institutions")
                                    .foregroundColor(.homesecondarytext)
                                    .font(.caption)
                            }
                            VStack(){
                                Text("50K+")
                                    .foregroundColor(Color.white)
                                    .font(.title2)
                                    .fontWeight(.semibold)
                                Text("Active Users")
                                    .foregroundColor(.homesecondarytext)
                                    .font(.caption)
                            }
                            
                            VStack(){
                                Text("99.9%")
                                    .foregroundColor(Color.white)
                                    .font(.title2)
                                    .fontWeight(.semibold)
                                Text("Uptime")
                                    .foregroundColor(.homesecondarytext)
                                    .font(.caption)
                            }
                        }
                        .padding()
                    }
                    .padding()
                }
            }
            
            
            //Join Now Button
            Button( action: {}, label: {
                Text("Join EduVerse 360")
                    .underline()
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(maxWidth:300,maxHeight: 40)
                    .padding(.horizontal, 30)
                    .padding(.vertical)
                    .background(Color.primary)
                    .cornerRadius(20)
                
                
            }
            )
            .padding(.top)
            
            
            Button( action: {}, label: {
                Text("Sign In")
                    .underline()
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.black)
                    .frame(maxWidth:300,maxHeight: 40)
                    .padding(.horizontal, 30)
                    .padding(.vertical)
                    .background(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(Color.textFieldColor, lineWidth: 1)
                            .shadow(radius: 20)
                    )
                    .cornerRadius(10)
                
                
                
            }
            )
            .padding()
            
            
            RoundedRectangle(cornerRadius: 50)
                .fill(Color.primary)
                .frame(width:40,height:5)
                .padding()
            
            Text("ENTERPRISE EDITION")
                .font(.footnote)
                .foregroundColor(Color.secondaryText)
            
            
            
            
            
            
        }
        
    }
}

#Preview {
    HomeView()
}
