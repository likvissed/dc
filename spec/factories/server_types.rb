FactoryBot.define do

  # factory :server_type do
  #   sequence(:name) { |i| "ServType_#{i}" }

  #   transient do
  #     details_count 3
  #   end

  #   after(:build) do |server_type, evaluator|
  #     evaluator.details_count.times { server_type.template_server_details << build(:template_server_detail, server_type: server_type, count: rand(1..10)) }
  #   end

  #   after(:create) do |server_type|
  #     server_type.template_server_details.each { |detail| detail.save! }
  #   end

  # end

  # factory :invalid_server_type, parent: :server_type do
  #   name ""
  # end

end
