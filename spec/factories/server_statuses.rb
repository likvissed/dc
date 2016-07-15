FactoryGirl.define do
  factory :server_status do
    sequence(:name) { |i| "Status_#{i}" }
  end

  factory :invalid_detail_type, parent: :detail_type do
    name ""
  end

end
