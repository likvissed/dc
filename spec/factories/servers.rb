FactoryBot.define do

  # factory :server do
  #   sequence(:name) { |i| "Server_#{i}" }
  #   sequence(:location) { |i| "Location_#{i}" }
  #   server_type
  #   server_status
  #   sequence(:inventory_num) { |i| "482754#{i}" }
  #   sequence(:serial_num) { |i| "a234_bhx8_sk234_#{i}" }

  #   transient do
  #     details_count 3
  #   end

  #   after(:build) do |server, evaluator|
  #     evaluator.details_count.times { server.real_server_details << build(:real_server_detail, server: server) }
  #   end

  #   after(:create) do |server|
  #     server.real_server_details.each { |detail| detail.save! }
  #   end

  # end

  # factory :invalid_server, parent: :server do
  #   name ""
  # end

  # factory :server_with_cluster, parent: :server do
  #   after(:create) do |server|
  #     cluster = create(:cluster)
  #     cluster.cluster_details << create(:cluster_detail, server: server, node_role: create(:node_role))
  #   end
  # end

end
