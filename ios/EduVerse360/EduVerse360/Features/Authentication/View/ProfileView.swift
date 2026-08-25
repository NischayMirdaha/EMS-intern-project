//
//  ProfileView.swift
//  EduVerse360
//
//  Created by Ekta Rai on 14/07/2026.
//

import SwiftUI

struct ProfileView: View {
    var body: some View {
        VStack(spacing:10) {
            Image(systemName: "person.fill")
                .foregroundColor(Color.primary)
                .font(.largeTitle)
                .fontWeight(.bold)
            Text(" Ekta Rai")
                .font(.title)
                .fontWeight(.semibold)
                .foregroundColor(Color.primary)
            
            
        }
    }
}

#Preview {
    ProfileView()
}
