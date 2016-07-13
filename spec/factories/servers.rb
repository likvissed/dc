FactoryGirl.define do

  factory :server do
    sequence(:name) { |i| "Server_#{i}" }
    server_type
    sequence(:inventory_num) { |i| "482754#{i}" }
    sequence(:serial_num) { |i| "a234_bhx8_sk234_#{i}" }

    transient do
      details_count 3
    end

    after(:build) do |server, evaluator|
      # server.real_server_details << build_list(:real_server_detail, 3, server:
      #   server, server_part: create(:server_part), count: rand(1..10))
      evaluator.details_count.times do
        server.real_server_details << build(:real_server_detail, server: server)
      end
    end

    after(:create) do |server|
      server.real_server_details.each { |detail| detail.save! }
    end

  end

  factory :invalid_server, parent: :server do
    name ""
  end

end
