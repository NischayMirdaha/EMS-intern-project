//
//  DashboardView.swift
//  EduVerse360
//
//  Created by Ekta Rai on 13/07/2026.
//

import SwiftUI

struct DashboardView: View {
    
    var body: some View {
        
        Text("Welcome to Dashboard")
            .font(.largeTitle)
            .foregroundColor(Color.blue)
            .fontWeight(.bold)
            .padding()
        Button( action: {
            
        }, label: {
            Text("Logout")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(Color.white)
                .frame(width:200)
                .padding()
                .background(Color.primary)
                .cornerRadius(30)
            
            
        }
        )
    }
}

#Preview {
    DashboardView()
}
